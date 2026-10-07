// Run: node --experimental-strip-types lib/search.test.ts
import assert from "node:assert";
import { matchesQuery } from "./search.ts";

const p = { title: "Attention Is All You Need", authors: ["Ashish Vaswani"], tags: ["NLP"], year: 2017, venue: "NeurIPS" };
assert(matchesQuery(p, ""));
assert(matchesQuery(p, "  "));
assert(matchesQuery(p, "attention vaswani"));   // words across fields
assert(matchesQuery(p, "2017 nlp"));            // year + tag
assert(matchesQuery(p, "ATTENTION"));           // case-insensitive
assert(!matchesQuery(p, "attention bengio"));   // every word required
assert(matchesQuery({ title: "x" }, "x"));      // missing optional fields
console.log("search ok");
