#!/usr/bin/env node
/**
 * validate-pack.js
 * Validates one or all GrantCraft scheme packs against the pack.schema.json.
 *
 * Usage:
 *   node scripts/validate-pack.js
 *                               → validates all packs in scheme_packs/
 *   node scripts/validate-pack.js horizon_europe_ria_ia
 *                               → validates a single pack by ID
 *
 * Exit codes:
 *   0  — all packs valid
 *   1  — one or more packs failed validation
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Colour helpers (no external dependency)
// ---------------------------------------------------------------------------
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  red:   '\x1b[31m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  cyan:  '\x1b[36m',
  dim:   '\x1b[2m',
};
const ok    = `${c.green}✓${c.reset}`;
const fail  = `${c.red}✗${c.reset}`;
const warn  = `${c.yellow}⚠${c.reset}`;
const info  = `${c.cyan}ℹ${c.reset}`;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT          = path.resolve(__dirname, '..');
const PACKS_DIR     = path.join(ROOT, 'scheme_packs');
const SCHEMA_PATH   = path.join(PACKS_DIR, '_schema', 'pack.schema.json');

// ---------------------------------------------------------------------------
// Load schema
// ---------------------------------------------------------------------------
if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`${fail} Schema not found at: ${SCHEMA_PATH}`);
  process.exit(1);
}
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// Minimal JSON Schema validator (subset: required, type, pattern, minItems,
// minLength, minimum, maximum, enum, properties, additionalProperties, items)
// Covers all constraints used in pack.schema.json without external deps.
// ---------------------------------------------------------------------------

/**
 * @param {any}    data    — value to validate
 * @param {object} schema  — JSON schema node
 * @param {string} path    — JSON path for error messages
 * @returns {string[]}     — list of error strings (empty = valid)
 */
function validate(data, schema, jsonPath = '#') {
  const errors = [];

  if (schema === true) return errors;
  if (schema === false) { errors.push(`${jsonPath}: schema disallows this value`); return errors; }

  // type
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = Array.isArray(data) ? 'array' : typeof data;
    if (!types.includes(actual)) {
      errors.push(`${jsonPath}: expected type [${types.join('|')}], got ${actual}`);
      return errors; // further checks would fail anyway
    }
  }

  // enum
  if (schema.enum !== undefined) {
    if (!schema.enum.includes(data)) {
      errors.push(`${jsonPath}: value ${JSON.stringify(data)} not in enum [${schema.enum.map(v => JSON.stringify(v)).join(', ')}]`);
    }
  }

  // string constraints
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(`${jsonPath}: string length ${data.length} < minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push(`${jsonPath}: string length ${data.length} > maxLength ${schema.maxLength}`);
    }
    if (schema.pattern !== undefined) {
      const re = new RegExp(schema.pattern);
      if (!re.test(data)) {
        errors.push(`${jsonPath}: "${data}" does not match pattern ${schema.pattern}`);
      }
    }
  }

  // number constraints
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`${jsonPath}: ${data} < minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(`${jsonPath}: ${data} > maximum ${schema.maximum}`);
    }
  }

  // object constraints
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    // required
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in data)) {
          errors.push(`${jsonPath}: missing required property "${key}"`);
        }
      }
    }
    // properties
    if (schema.properties) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          errors.push(...validate(data[key], subSchema, `${jsonPath}.${key}`));
        }
      }
    }
    // additionalProperties (only if false)
    if (schema.additionalProperties === false && schema.properties) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(data)) {
        if (!allowed.has(key)) {
          errors.push(`${jsonPath}: additional property "${key}" not allowed`);
        }
      }
    }
    // patternProperties / additionalProperties as schema
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      const allowedKeys = schema.properties ? Object.keys(schema.properties) : [];
      for (const [key, val] of Object.entries(data)) {
        if (!allowedKeys.includes(key)) {
          errors.push(...validate(val, schema.additionalProperties, `${jsonPath}.${key}`));
        }
      }
    }
  }

  // array constraints
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${jsonPath}: array length ${data.length} < minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push(`${jsonPath}: array length ${data.length} > maxItems ${schema.maxItems}`);
    }
    if (schema.items) {
      data.forEach((item, i) => {
        errors.push(...validate(item, schema.items, `${jsonPath}[${i}]`));
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Business-logic checks (beyond JSON schema)
// ---------------------------------------------------------------------------
function checkPackSemantics(pack, packId) {
  const warnings = [];
  const errors   = [];

  // id must match directory name
  if (pack.id !== packId) {
    errors.push(`pack.id "${pack.id}" does not match directory name "${packId}"`);
  }

  // scoring_rules: weights should sum to ~1
  if (pack.scoring_rules && pack.scoring_rules.weights) {
    const sum = Object.values(pack.scoring_rules.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      warnings.push(`scoring_rules.weights sum to ${sum.toFixed(4)} — expected 1.0`);
    }
  }

  // every evaluation_criteria id should have a matching entry in scoring_rules.weights
  if (pack.evaluation_criteria && pack.scoring_rules && pack.scoring_rules.weights) {
    for (const crit of pack.evaluation_criteria) {
      if (!(crit.id in pack.scoring_rules.weights)) {
        warnings.push(`evaluation criterion "${crit.id}" has no entry in scoring_rules.weights`);
      }
    }
  }

  // every subsection.criterion must reference a known criterion id
  if (pack.evaluation_criteria && pack.required_sections) {
    const critIds = new Set(pack.evaluation_criteria.map(c => c.id));
    for (const section of pack.required_sections) {
      for (const sub of (section.subsections || [])) {
        if (sub.criterion && !critIds.has(sub.criterion)) {
          errors.push(`Section "${section.id}" > subsection "${sub.id}": unknown criterion id "${sub.criterion}"`);
        }
      }
    }
  }

  // keywords_index keys should match evaluation criteria ids
  if (pack.keywords_index && pack.evaluation_criteria) {
    const critIds = new Set(pack.evaluation_criteria.map(c => c.id));
    for (const key of Object.keys(pack.keywords_index)) {
      if (!critIds.has(key)) {
        warnings.push(`keywords_index key "${key}" does not match any evaluation_criteria id`);
      }
    }
  }

  // last_updated should be a date in the past
  if (pack.metadata && pack.metadata.last_updated) {
    const d = new Date(pack.metadata.last_updated);
    if (isNaN(d.getTime())) {
      errors.push(`metadata.last_updated "${pack.metadata.last_updated}" is not a valid date`);
    } else if (d > new Date()) {
      warnings.push(`metadata.last_updated "${pack.metadata.last_updated}" is in the future`);
    }
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Validate a single pack by ID
// ---------------------------------------------------------------------------
function validatePack(packId) {
  const packDir  = path.join(PACKS_DIR, packId);
  const packFile = path.join(packDir, 'pack.json');

  console.log(`\n${c.bold}Validating pack: ${c.cyan}${packId}${c.reset}`);
  console.log(`  ${c.dim}${packFile}${c.reset}`);

  if (!fs.existsSync(packFile)) {
    console.log(`  ${fail} pack.json not found`);
    return false;
  }

  let pack;
  try {
    pack = JSON.parse(fs.readFileSync(packFile, 'utf8'));
  } catch (e) {
    console.log(`  ${fail} JSON parse error: ${e.message}`);
    return false;
  }

  // JSON Schema validation
  const schemaErrors = validate(pack, schema, '#');
  if (schemaErrors.length > 0) {
    console.log(`  ${fail} ${c.red}JSON schema violations (${schemaErrors.length}):${c.reset}`);
    schemaErrors.forEach(e => console.log(`    ${c.red}•${c.reset} ${e}`));
  }

  // Semantic checks
  const { errors: semErrors, warnings: semWarnings } = checkPackSemantics(pack, packId);
  if (semErrors.length > 0) {
    console.log(`  ${fail} ${c.red}Semantic errors (${semErrors.length}):${c.reset}`);
    semErrors.forEach(e => console.log(`    ${c.red}•${c.reset} ${e}`));
  }
  if (semWarnings.length > 0) {
    console.log(`  ${warn} ${c.yellow}Warnings (${semWarnings.length}):${c.reset}`);
    semWarnings.forEach(w => console.log(`    ${c.yellow}•${c.reset} ${w}`));
  }

  // Optional file checks
  const optionalFiles = ['rubric.json', 'guidance.md', 'PACK_README.md'];
  const missingOptional = optionalFiles.filter(f => !fs.existsSync(path.join(packDir, f)));
  if (missingOptional.length > 0) {
    console.log(`  ${warn} ${c.yellow}Optional files not present:${c.reset} ${missingOptional.join(', ')}`);
  }

  // Summary
  const totalErrors = schemaErrors.length + semErrors.length;
  if (totalErrors === 0) {
    const sections  = pack.required_sections  ? pack.required_sections.length  : '?';
    const criteria  = pack.evaluation_criteria ? pack.evaluation_criteria.length : '?';
    const checklist = pack.compliance_checklist ? pack.compliance_checklist.length : '?';
    console.log(`  ${ok} ${c.green}VALID${c.reset}`);
    console.log(`  ${info} ${sections} sections, ${criteria} criteria, ${checklist} compliance items`);
    if (semWarnings.length > 0) {
      console.log(`  ${warn} ${semWarnings.length} warning(s) — review before publishing`);
    }
    return true;
  } else {
    console.log(`  ${fail} ${c.red}INVALID — ${totalErrors} error(s)${c.reset}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Discover all packs
// ---------------------------------------------------------------------------
function discoverPacks() {
  return fs.readdirSync(PACKS_DIR).filter(entry => {
    if (entry.startsWith('_')) return false; // skip _schema etc.
    const stat = fs.statSync(path.join(PACKS_DIR, entry));
    return stat.isDirectory();
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const verbose = process.argv.includes('--verbose');

const packIds = args.length > 0 ? args : discoverPacks();

console.log(`${c.bold}GrantCraft Pack Validator${c.reset}`);
console.log(`${c.dim}Schema: ${SCHEMA_PATH}${c.reset}`);
console.log(`${c.dim}Packs to validate: ${packIds.join(', ')}${c.reset}`);

let allValid = true;
for (const id of packIds) {
  const valid = validatePack(id);
  if (!valid) allValid = false;
}

console.log('\n' + '─'.repeat(50));
if (allValid) {
  console.log(`${ok} ${c.green}${c.bold}All packs valid.${c.reset}`);
  process.exit(0);
} else {
  console.log(`${fail} ${c.red}${c.bold}One or more packs failed validation.${c.reset}`);
  process.exit(1);
}
