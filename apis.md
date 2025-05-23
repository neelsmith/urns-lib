
# `urn-lib.js` API Documentation

This library provides tools for parsing, validating, comparing, and retrieving data associated with CTS (Canonical Text Services) URNs and CITE2 URNs.

## Table of Contents

1.  [Installation & Usage](#installation--usage)
2.  [Global Object: `URNTools`](#global-object-urntools)
3.  [CTS URN Functions](#cts-urn-functions)
    *   [Core CTS Functions](#core-cts-functions)
    *   [CTS Accessor Functions](#cts-accessor-functions)
    *   [CTS Comparison Functions](#cts-comparison-functions)
    *   [CTS Data Retrieval](#cts-data-retrieval)
4.  [CITE2 URN Functions](#cite2-urn-functions)
    *   [Core CITE2 Functions](#core-cite2-functions)
    *   [CITE2 Accessor Functions](#cite2-accessor-functions)
    *   [CITE2 Comparison Functions](#cite2-comparison-functions)
    *   [CITE2 Data Retrieval](#cite2-data-retrieval)

## Installation & Usage

### Browser

Include `urn-lib.js` in your HTML file:

```html
<script src="path/to/urn-lib.js"></script>
<script>
    // All functions are available under the URNTools global object
    const isValid = URNTools.isValidCtsUrn("urn:cts:greekLit:tlg0012.tlg001:1.1");
    console.log(isValid);
</script>
```

Via jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/gh/neelsmith/urns-lib/urn-lib.js"></script>
```

### Node.js (CommonJS)

If you adapt the library for Node.js (e.g., by changing the UMD wrapper), you might use it like this:

```javascript
const URNTools = require('./urn-lib.js'); // Assuming the export mechanism is adjusted

const isValid = URNTools.isValidCtsUrn("urn:cts:greekLit:tlg0012.tlg001:1.1");
console.log(isValid);
```
*(Note: The current library is primarily set up for browser usage with a global `URNTools` object.)*

## Global Object: `URNTools`

All public functions of this library are exposed through the global `URNTools` object.

---

## CTS URN Functions

Functions for working with Canonical Text Services (CTS) URNs.
CTS URNs have 5 components: `urn:cts:<namespace>:<work-component>:<passage-component>`

### Core CTS Functions

#### `URNTools.parseCtsUrn(urnString)`

Parses a CTS URN string into a detailed object.

*   **Parameters:**
    *   `urnString` (String): The CTS URN string to parse.
*   **Returns:** (Object) An object with the following properties:
    *   `valid` (Boolean): `true` if the URN is syntactically valid, `false` otherwise.
    *   `original` (String): The original URN string.
    *   `error` (String | null): An error message if `valid` is `false`, otherwise `null`.
    *   `protocol` (String | null): The first component (e.g., "urn").
    *   `nid` (String | null): The second component (e.g., "cts").
    *   `namespace` (String | null): The third component (CTS namespace).
    *   `workComponent` (String | null): The fourth component (work identifier).
    *   `passageComponent` (String | null): The fifth component (passage identifier, can be empty).
    *   `workParts` (Object):
        *   `textgroup` (String | null)
        *   `workid` (String | null)
        *   `version` (String | null)
        *   `exemplar` (String | null)
    *   `passageParts` (Object):
        *   `isRange` (Boolean): `true` if the passage component is a range.
        *   `reference` (String | null): The full passage reference if not a range (can be empty).
        *   `referenceParts` (String[]): Period-separated parts of the `reference`.
        *   `start` (String | null): The start of the range if `isRange` is `true`.
        *   `startParts` (String[]): Period-separated parts of the `start` reference.
        *   `end` (String | null): The end of the range if `isRange` is `true`.
        *   `endParts` (String[]): Period-separated parts of the `end` reference.

#### `URNTools.isValidCtsUrn(urnString)`

Determines if a string is a syntactically valid CTS URN.

*   **Parameters:**
    *   `urnString` (String): The string to validate.
*   **Returns:** (Boolean) `true` if valid, `false` otherwise.

### CTS Accessor Functions

These functions return specific components of a valid CTS URN. They return `null` if the URN is invalid or the component is not present (where applicable).

*   `URNTools.ctsnamespace(urnString)`: Returns the namespace (3rd component).
*   `URNTools.workcomponent(urnString)`: Returns the work component (4th component).
*   `URNTools.passagecomponent(urnString)`: Returns the passage component (5th component, possibly empty).
*   `URNTools.textgroup(urnString)`: Returns the textgroup part of the work component.
*   `URNTools.workid(urnString)`: Returns the work ID part of the work component (possibly null).
*   `URNTools.version(urnString)`: Returns the version part of the work component (possibly null). (Note: this is the work's version, not to be confused with CITE2 version).
*   `URNTools.exemplar(urnString)`: Returns the exemplar part of the work component (possibly null).

### CTS Comparison Functions

#### `URNTools.areCtsUrnsEqual(urnString1, urnString2)`

Checks if two CTS URNs are strictly equal in all their components.

*   **Parameters:**
    *   `urnString1` (String): The first CTS URN.
    *   `urnString2` (String): The second CTS URN.
*   **Returns:** (Boolean) `true` if equal, `false` otherwise. Returns `false` if either URN is invalid.

#### `URNTools.areCtsUrnsCongruent(urnString1, urnString2)`

Checks if two CTS URNs are congruent.
Two CTS URNs are congruent if:
1.  They have the same namespace.
2.  For their work components, each period-separated part that is present in both is equal. If one URN has fewer work parts, it's congruent if its parts match the corresponding initial parts of the other.
3.  For their passage components (if not ranges), the same logic as for work components applies to their period-separated parts.
4.  If both are ranges, their start passage parts must be congruent, and their end passage parts must be congruent.
5.  They must both be ranges or both not be ranges.

*   **Parameters:**
    *   `urnString1` (String): The first CTS URN.
    *   `urnString2` (String): The second CTS URN.
*   **Returns:** (Boolean) `true` if congruent, `false` otherwise. Returns `false` if either URN is invalid.

### CTS Data Retrieval

#### `URNTools.retrieveCtsPassages(searchUrnString, corpusDataString)`

Retrieves passages from a pipe-delimited (`|`) text corpus that match a given CTS URN. The first column of the corpus is assumed to be a CTS URN, and the second is the text content. The first line of `corpusDataString` is skipped (assumed header).

Matching logic:
1.  **Namespace & Work Hierarchy:** The corpus URN's namespace must match the search URN's. The search URN's work component parts must be a hierarchical prefix of the corpus URN's work component parts.
2.  **Passage Matching:**
    *   **If `searchUrnString` is a range:**
        *   The corpus URN must not be a range.
        *   The corpus URN's passage identifier (as a string) must lexicographically fall within or be equal to the start and end identifiers of the search range.
        *   More precisely: The effective start passage in the corpus is the first passage hierarchically matching/contained in the search range's start. The effective end passage is the last passage hierarchically matching/contained in the search range's end. All passages in the corpus between these (inclusive) are returned.
    *   **If `searchUrnString` is a single passage or container (empty passage component):**
        *   The corpus URN must not be a range.
        *   The search URN's passage component parts must be a hierarchical prefix of the corpus URN's passage component parts. (e.g., search `1` matches corpus `1.1`; search empty matches corpus `1.1`).

*   **Parameters:**
    *   `searchUrnString` (String): The CTS URN to search for.
    *   `corpusDataString` (String): The string content of the corpus data.
*   **Returns:** (Array of Objects) An array of matching passages, each object having:
    *   `urn` (String): The full CTS URN from the corpus.
    *   `text` (String): The text content associated with the URN.
    Returns an empty array if the search URN is invalid or no matches are found.

---

## CITE2 URN Functions

Functions for working with CITE2 URNs.
CITE2 URNs have 5 components: `urn:cite2:<namespace>:<collection-component>:<object-component>`

### Core CITE2 Functions

#### `URNTools.parseCite2Urn(urnString)`

Parses a CITE2 URN string into a detailed object.

*   **Parameters:**
    *   `urnString` (String): The CITE2 URN string to parse.
*   **Returns:** (Object) An object with the following properties:
    *   `valid` (Boolean): `true` if the URN is syntactically valid, `false` otherwise.
    *   `original` (String): The original URN string.
    *   `error` (String | null): An error message if `valid` is `false`, otherwise `null`.
    *   `protocol` (String | null): The first component (e.g., "urn").
    *   `nid` (String | null): The second component (e.g., "cite2").
    *   `namespace` (String | null): The third component (CITE2 namespace).
    *   `collectionComponent` (String | null): The fourth component (collection identifier).
    *   `objectComponent` (String | null): The fifth component (object identifier, can be empty or a range).
    *   `collectionParts` (Object):
        *   `collectionid` (String | null)
        *   `versionid` (String | null)
        *   `propertyid` (String | null)
    *   `objectParts` (Object):
        *   `isRange` (Boolean): `true` if the object component is a range.
        *   `reference` (String | null): The object identifier if not a range (can be empty).
        *   `start` (String | null): The start of the range if `isRange` is `true`.
        *   `end` (String | null): The end of the range if `isRange` is `true`.

#### `URNTools.isValidCite2Urn(urnString)`

Determines if a string is a syntactically valid CITE2 URN.

*   **Parameters:**
    *   `urnString` (String): The string to validate.
*   **Returns:** (Boolean) `true` if valid, `false` otherwise.

### CITE2 Accessor Functions

These functions return specific components of a valid CITE2 URN. They return `null` if the URN is invalid or the component is not present (where applicable).

*   `URNTools.cite2namespace(urnString)`: Returns the namespace (3rd component).
*   `URNTools.collectioncomponent(urnString)`: Returns the collection component (4th component).
*   `URNTools.objectcomponent(urnString)`: Returns the object component (5th component, possibly empty).
*   `URNTools.collectionid(urnString)`: Returns the collection ID part of the collection component.
*   `URNTools.versionid(urnString)`: Returns the version ID part of the collection component (possibly null).
*   `URNTools.propertyid(urnString)`: Returns the property ID part of the collection component (possibly null).

### CITE2 Comparison Functions

#### `URNTools.areCite2UrnsEqual(urnString1, urnString2)`

Checks if two CITE2 URNs are strictly equal in all their components.

*   **Parameters:**
    *   `urnString1` (String): The first CITE2 URN.
    *   `urnString2` (String): The second CITE2 URN.
*   **Returns:** (Boolean) `true` if equal, `false` otherwise. Returns `false` if either URN is invalid.

#### `URNTools.areCite2UrnsCongruent(urnString1, urnString2)`

Checks if two CITE2 URNs are congruent.
Two CITE2 URNs are congruent if:
1.  They have the same namespace.
2.  For their collection components, each period-separated part that is present in both is equal. If one URN has fewer collection parts, it's congruent if its parts match the corresponding initial parts of the other.
(The object component is NOT considered for CITE2 congruence).

*   **Parameters:**
    *   `urnString1` (String): The first CITE2 URN.
    *   `urnString2` (String): The second CITE2 URN.
*   **Returns:** (Boolean) `true` if congruent, `false` otherwise. Returns `false` if either URN is invalid.

### CITE2 Data Retrieval

#### `URNTools.retrieveCite2Objects(searchUrnString, corpusDataString)`

Retrieves rows from a pipe-delimited (`|`) text corpus that match a given CITE2 URN. The first non-empty line of `corpusDataString` is treated as a header. One column in the header must be labeled `urn` and contain CITE2 URNs for data rows.

Matching logic:
1.  **Parse Corpus:** Identifies header and the `urn` column. Parses CITE2 URNs from this column in data rows.
2.  **Collection Congruence:** Corpus row URNs must be congruent with the `searchUrnString` based on `areCite2UrnsCongruent` (checks namespace and collection hierarchy).
3.  **Object Matching:**
    *   **If `searchUrnString` is NOT a range:**
        *   If `searchUrnString` has an empty object component, it matches any (collection-congruent) corpus row.
        *   If `searchUrnString` has a non-empty object component, it must be *identical* to the corpus row's object component.
    *   **If `searchUrnString` IS a range:**
        *   The effective start object in the corpus is the first (collection-congruent) row whose object component exactly matches the search range's start identifier.
        *   The effective end object in the corpus is the last (collection-congruent) row whose object component exactly matches the search range's end identifier.
        *   All rows in the corpus data between these (inclusive and in corpus order) are returned.
        *   Corpus URNs that are themselves ranges are ignored for matching.

*   **Parameters:**
    *   `searchUrnString` (String): The CITE2 URN to search for.
    *   `corpusDataString` (String): The string content of the pipe-delimited corpus data.
*   **Returns:** (Object) An object with the following properties:
    *   `header` (String[]): An array of column names from the corpus header.
    *   `rows` (Array of String[]): An array of matching data rows, where each row is an array of its string values.
    *   `error` (String | null): An error message if an issue occurred (e.g., invalid search URN, no 'urn' column), otherwise `null`.


