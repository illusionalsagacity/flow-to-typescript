import { parse } from "@babel/parser";
import generate from "@babel/generator";
import traverse, { Node, Visitor } from "@babel/traverse";
import { File } from "@babel/types";
import { sync } from "glob";
import { dropWhile, pullAt } from "lodash";
import { EOL } from "os";
import { relative, resolve } from "path";

type Warning = [string, string, number, number];
type Rule = (warnings: Warning[]) => Visitor<Node>;

let rules = new Map<string, Rule>();

export function addRule(ruleName: string, rule: Rule) {
  if (rules.has(ruleName)) {
    throw `A rule with the name "${ruleName}" is already defined`;
  }
  rules.set(ruleName, rule);
}

export async function compile(code: string, filename: string) {
  console.log("Parse...");
  const parsed = parse(code, {
    plugins: ["classProperties", "flow", "objectRestSpread"],
    sourceType: "module",
  });
  console.log("Convert...");
  let [warnings, ast] = await convert(parsed);

  console.log("Warnings...");
  warnings.forEach(([message, issueURL, line, column]) => {
    console.log(
      `Warning: ${message} (at ${relative(
        __dirname,
        filename
      )}: line ${line}, column ${column}). See ${issueURL}`
    );
  });

  console.log("Strip flow annotations...");
  return addTrailingSpace(
    trimLeadingNewlines(generate(stripAtFlowAnnotation(ast)).code)
  );
}

/**
 * @internal
 */
export async function convert<T extends Node>(ast: T): Promise<[Warning[], T]> {
  console.log("Loading rules...");
  // load rules directory
  await Promise.all(
    sync(resolve(__dirname, "./rules/*.js")).map(_ => import(_))
  );

  let warnings: Warning[] = [];
  rules.forEach((visitor, i) => {
    console.log(`Running visitor ${i}`);

    return traverse(ast, visitor(warnings));
  });
  console.log("Done");

  return [warnings, ast];
}

function stripAtFlowAnnotation(ast: File): File {
  let { leadingComments } = ast.program.body[0];
  if (leadingComments) {
    let index = leadingComments.findIndex(_ => _.value.trim() === "@flow");
    if (index > -1) {
      pullAt(leadingComments, index);
    }
  }
  return ast;
}

function addTrailingSpace(file: string): string {
  if (file.endsWith(EOL)) {
    return file;
  }
  return file + EOL;
}

function trimLeadingNewlines(file: string): string {
  return dropWhile(file.split(EOL), _ => !_).join(EOL);
}
