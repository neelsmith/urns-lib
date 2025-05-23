(function(exports) {
    'use strict';

    // --- HELPER FUNCTIONS ---

    /**
     * Splits a component string by period, ensuring no empty parts result.
     * @param {string} componentStr The component string.
     * @returns {string[]|null} Array of parts, or null if invalid (e.g., "a..b").
     */
    function _splitComponentString(componentStr) {
        if (componentStr === "") return [];
        const parts = componentStr.split('.');
        if (parts.some(p => p === "")) return null; // No empty parts like "a..b"
        return parts;
    }

    /**
     * Compares two arrays of component parts for general congruence.
     * Congruent if all parts in the shorter array match corresponding parts in the longer array,
     * AND if the shorter array is truly a prefix (i.e., the longer array doesn't have *fewer* matching parts).
     * This is used for the general areCtsUrnsCongruent and areCite2UrnsCongruent.
     * @param {string[]} parts1 First array of parts.
     * @param {string[]} parts2 Second array of parts.
     * @returns {boolean} True if congruent, false otherwise.
     */
    function _areComponentPartsCongruent(parts1, parts2) {
        if (!parts1 || !parts2) return false;
        const minLen = Math.min(parts1.length, parts2.length);
        // For general congruence, the one with fewer components dictates the comparison length.
        // All its components must match the corresponding components of the other.
        for (let i = 0; i < minLen; i++) {
            if (parts1[i] !== parts2[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if `searchParts` is a hierarchical prefix of `corpusParts`.
     * e.g., ["1"] is a prefix of ["1", "1"], ["1", "2"].
     * e.g., ["1", "1"] is a prefix of ["1", "1", "a"].
     * It is NOT a prefix if searchParts is longer, or any part mismatches.
     * An empty searchParts array is considered a prefix of any corpusParts array.
     * @param {string[]} searchParts The parts of the searching component.
     * @param {string[]} corpusParts The parts of the component from the corpus.
     * @returns {boolean} True if searchParts is a hierarchical prefix of corpusParts.
     */
    function _isHierarchicalPrefix(searchParts, corpusParts) {
        if (!searchParts || !corpusParts) return false;
        // If searchParts is empty (e.g., passage component is empty, meaning whole work/textgroup),
        // it is considered a prefix for any specific passage within that work.
        if (searchParts.length === 0) return true;

        if (searchParts.length > corpusParts.length) return false; // Search cannot be more specific and still be a prefix

        for (let i = 0; i < searchParts.length; i++) {
            if (searchParts[i] !== corpusParts[i]) {
                return false;
            }
        }
        return true;
    }


    // --- CTS URN Core Logic ---

    function parseCtsUrn(urnString) {
        const result = {
            valid: false,
            original: urnString,
            error: null,
            protocol: null,
            nid: null,
            namespace: null,
            workComponent: null,
            passageComponent: null,
            workParts: { textgroup: null, workid: null, version: null, exemplar: null },
            passageParts: { isRange: false, reference: null, referenceParts: [], start: null, startParts: [], end: null, endParts: [] }
        };

        if (typeof urnString !== 'string') {
            result.error = "Input is not a string.";
            return result;
        }

        const parts = urnString.split(':');
        if (parts.length !== 5) {
            result.error = "CTS URN must have 5 colon-delimited components.";
            return result;
        }

        result.protocol = parts[0];
        result.nid = parts[1];
        result.namespace = parts[2];
        result.workComponent = parts[3];
        result.passageComponent = parts[4];

        if (result.protocol !== 'urn') {
            result.error = "Component 1 must be 'urn'.";
            return result;
        }
        if (result.nid !== 'cts') {
            result.error = "Component 2 must be 'cts'.";
            return result;
        }
        if (!result.namespace) {
            result.error = "Component 3 (namespace) must be non-empty.";
            return result;
        }
        if (!result.workComponent) {
            result.error = "Component 4 (work component) must be non-empty.";
            return result;
        }

        const workComponentParts = _splitComponentString(result.workComponent);
        if (!workComponentParts || workComponentParts.length === 0 || workComponentParts.length > 4) {
            result.error = "Work component must have 1-4 non-empty, period-separated parts.";
            return result;
        }
        result.workParts.textgroup = workComponentParts[0] || null;
        result.workParts.workid = workComponentParts[1] || null;
        result.workParts.version = workComponentParts[2] || null;
        result.workParts.exemplar = workComponentParts[3] || null;

        const passageStr = result.passageComponent;
        if (passageStr.includes('-')) {
            const rangeParts = passageStr.split('-');
            if (rangeParts.length !== 2 || !rangeParts[0] || !rangeParts[1]) {
                result.error = "Passage range must have a non-empty start and end, separated by one hyphen.";
                return result;
            }
            const startPassageParts = _splitComponentString(rangeParts[0]);
            const endPassageParts = _splitComponentString(rangeParts[1]);

            if (!startPassageParts || startPassageParts.length === 0) {
                result.error = "Range start identifier must have at least one non-empty part.";
                return result;
            }
            if (!endPassageParts || endPassageParts.length === 0) {
                result.error = "Range end identifier must have at least one non-empty part.";
                return result;
            }
            result.passageParts.isRange = true;
            result.passageParts.start = rangeParts[0];
            result.passageParts.startParts = startPassageParts;
            result.passageParts.end = rangeParts[1];
            result.passageParts.endParts = endPassageParts;
        } else if (passageStr === "") {
            result.passageParts.isRange = false;
            result.passageParts.reference = "";
            result.passageParts.referenceParts = []; // Explicitly an empty array
        } else {
            const singlePassageParts = _splitComponentString(passageStr);
            if (!singlePassageParts || singlePassageParts.length === 0) {
                result.error = "Non-empty, non-range passage identifier must have at least one non-empty part.";
                return result;
            }
            result.passageParts.isRange = false;
            result.passageParts.reference = passageStr;
            result.passageParts.referenceParts = singlePassageParts;
        }

        result.valid = true;
        return result;
    }

    function isValidCtsUrn(urnString) {
        return parseCtsUrn(urnString).valid;
    }

    function ctsnamespace(urnString) {
        const p = parseCtsUrn(urnString);
        return p.valid ? p.namespace : null;
    }
    function workcomponent(urnString) {
        const p = parseCtsUrn(urnString);
        return p.valid ? p.workComponent : null;
    }
    function passagecomponent(urnString) {
        const p = parseCtsUrn(urnString);
        return p.valid ? p.passageComponent : null;
    }
    function textgroup(urnString) {
        const p = parseCtsUrn(urnString);
        return p.valid ? p.workParts.textgroup : null;
    }
    function workid(urnString) {
        const p = parseCtsUrn(urnString);
        return p.valid ? p.workParts.workid : null;
    }
    function version(urnString) {
        const p = parseCtsUrn(urnString);
        return p.valid ? p.workParts.version : null;
    }
    function exemplar(urnString) {
        const p = parseCtsUrn(urnString);
        return p.valid ? p.workParts.exemplar : null;
    }

    function areCtsUrnsEqual(urnString1, urnString2) {
        const p1 = parseCtsUrn(urnString1);
        const p2 = parseCtsUrn(urnString2);
        if (!p1.valid || !p2.valid) return false;
        return p1.namespace === p2.namespace &&
               p1.workComponent === p2.workComponent &&
               p1.passageComponent === p2.passageComponent;
    }

    function areCtsUrnsCongruent(urnString1, urnString2) {
        const p1 = parseCtsUrn(urnString1);
        const p2 = parseCtsUrn(urnString2);

        if (!p1.valid || !p2.valid) return false;
        if (p1.namespace !== p2.namespace) return false;

        const p1WorkActualParts = [p1.workParts.textgroup, p1.workParts.workid, p1.workParts.version, p1.workParts.exemplar].filter(Boolean);
        const p2WorkActualParts = [p2.workParts.textgroup, p2.workParts.workid, p2.workParts.version, p2.workParts.exemplar].filter(Boolean);
        if (!_areComponentPartsCongruent(p1WorkActualParts, p2WorkActualParts)) return false;

        if (p1.passageParts.isRange !== p2.passageParts.isRange) return false;

        if (p1.passageParts.isRange) {
            if (!_areComponentPartsCongruent(p1.passageParts.startParts, p2.passageParts.startParts)) return false;
            if (!_areComponentPartsCongruent(p1.passageParts.endParts, p2.passageParts.endParts)) return false;
        } else {
            if (!_areComponentPartsCongruent(p1.passageParts.referenceParts, p2.passageParts.referenceParts)) return false;
        }
        return true;
    }

    function retrieveCtsPassages(searchUrnString, corpusDataString) {
        const searchUrnObj = parseCtsUrn(searchUrnString);
        if (!searchUrnObj.valid) {
            console.error("Invalid search URN:", searchUrnObj.error);
            return [];
        }

        const lines = corpusDataString.split('\n');
        const results = [];
        const dataLines = lines.slice(1);

        for (const line of dataLines) {
            if (line.trim() === "") continue;
            const parts = line.split('|');
            if (parts.length < 2) continue;

            const corpusUrnString = parts[0].trim();
            const textContent = parts.slice(1).join('|').trim();
            const corpusUrnObj = parseCtsUrn(corpusUrnString);

            if (!corpusUrnObj.valid) continue;

            if (searchUrnObj.namespace !== corpusUrnObj.namespace) continue;

            const searchWorkPartsArray = [searchUrnObj.workParts.textgroup, searchUrnObj.workParts.workid, searchUrnObj.workParts.version, searchUrnObj.workParts.exemplar].filter(p => p !== null && p !== undefined);
            const corpusWorkPartsArray = [corpusUrnObj.workParts.textgroup, corpusUrnObj.workParts.workid, corpusUrnObj.workParts.version, corpusUrnObj.workParts.exemplar].filter(p => p !== null && p !== undefined);
            if (!_isHierarchicalPrefix(searchWorkPartsArray, corpusWorkPartsArray)) continue;

            if (searchUrnObj.passageParts.isRange) {
                if (corpusUrnObj.passageParts.isRange) continue;
                if (corpusUrnObj.passageParts.reference === "") continue;

                const corpusRef = corpusUrnObj.passageParts.reference;
                const rangeStart = searchUrnObj.passageParts.start;
                const rangeEnd = searchUrnObj.passageParts.end;
                
                if (corpusRef >= rangeStart && corpusRef <= rangeEnd) {
                    results.push({ urn: corpusUrnString, text: textContent });
                }
            } else {
                if (corpusUrnObj.passageParts.isRange) continue;
                // For non-range search, an empty passage in corpus might only be matched by an empty search passage.
                // If search passage is specific (not empty), but corpus passage is empty, it's not a match.
                if (searchUrnObj.passageParts.reference !== "" && corpusUrnObj.passageParts.reference === "") continue;


                if (_isHierarchicalPrefix(searchUrnObj.passageParts.referenceParts, corpusUrnObj.passageParts.referenceParts)) {
                    results.push({ urn: corpusUrnString, text: textContent });
                }
            }
        }
        return results;
    }

    // --- CITE2 URN Core Logic ---
    function parseCite2Urn(urnString) {
        const result = {
            valid: false,
            original: urnString,
            error: null,
            protocol: null,
            nid: null,
            namespace: null,
            collectionComponent: null,
            objectComponent: null,
            collectionParts: { collectionid: null, versionid: null, propertyid: null },
            objectParts: { isRange: false, reference: null, start: null, end: null }
        };

        if (typeof urnString !== 'string') {
            result.error = "Input is not a string.";
            return result;
        }

        const parts = urnString.split(':');
        if (parts.length !== 5) {
            result.error = "CITE2 URN must have 5 colon-delimited components.";
            return result;
        }

        result.protocol = parts[0];
        result.nid = parts[1];
        result.namespace = parts[2];
        result.collectionComponent = parts[3];
        result.objectComponent = parts[4];

        if (result.protocol !== 'urn') {
            result.error = "Component 1 must be 'urn'.";
            return result;
        }
        if (result.nid !== 'cite2') {
            result.error = "Component 2 must be 'cite2'.";
            return result;
        }
        if (!result.namespace) {
            result.error = "Component 3 (namespace) must be non-empty.";
            return result;
        }
        if (!result.collectionComponent) {
            result.error = "Component 4 (collection component) must be non-empty.";
            return result;
        }

        const collectionComponentParts = _splitComponentString(result.collectionComponent);
        if (!collectionComponentParts || collectionComponentParts.length === 0 || collectionComponentParts.length > 3) {
            result.error = "Collection component must have 1-3 non-empty, period-separated parts.";
            return result;
        }
        result.collectionParts.collectionid = collectionComponentParts[0] || null;
        result.collectionParts.versionid = collectionComponentParts[1] || null;
        result.collectionParts.propertyid = collectionComponentParts[2] || null;

        const objectStr = result.objectComponent;
        if (objectStr.includes('-')) {
            const rangeParts = objectStr.split('-');
            if (rangeParts.length !== 2 || !rangeParts[0] || !rangeParts[1] || rangeParts[0].includes('-') || rangeParts[1].includes('-')) {
                result.error = "Object component range must have a non-empty start and end, separated by one hyphen. Start/end cannot contain hyphens.";
                return result;
            }
            result.objectParts.isRange = true;
            result.objectParts.start = rangeParts[0];
            result.objectParts.end = rangeParts[1];
        } else if (objectStr === "") {
            result.objectParts.isRange = false;
            result.objectParts.reference = "";
        } else {
             if (objectStr.includes('-')) {
                result.error = "Single object identifier cannot contain a hyphen.";
                return result;
            }
            result.objectParts.isRange = false;
            result.objectParts.reference = objectStr;
        }

        result.valid = true;
        return result;
    }

    function isValidCite2Urn(urnString) {
        return parseCite2Urn(urnString).valid;
    }

    function cite2namespace(urnString) {
        const p = parseCite2Urn(urnString);
        return p.valid ? p.namespace : null;
    }
    function collectioncomponent(urnString) {
        const p = parseCite2Urn(urnString);
        return p.valid ? p.collectionComponent : null;
    }
    function objectcomponent(urnString) {
        const p = parseCite2Urn(urnString);
        return p.valid ? p.objectComponent : null;
    }
    function collectionid(urnString) {
        const p = parseCite2Urn(urnString);
        return p.valid ? p.collectionParts.collectionid : null;
    }
    function versionid(urnString) { // CITE2 collection version
        const p = parseCite2Urn(urnString);
        return p.valid ? p.collectionParts.versionid : null;
    }
    function propertyid(urnString) {
        const p = parseCite2Urn(urnString);
        return p.valid ? p.collectionParts.propertyid : null;
    }

    function areCite2UrnsEqual(urnString1, urnString2) {
        const p1 = parseCite2Urn(urnString1);
        const p2 = parseCite2Urn(urnString2);
        if (!p1.valid || !p2.valid) return false;
        return p1.namespace === p2.namespace &&
               p1.collectionComponent === p2.collectionComponent &&
               p1.objectComponent === p2.objectComponent;
    }

    function areCite2UrnsCongruent(urnString1, urnString2) {
        const p1 = parseCite2Urn(urnString1);
        const p2 = parseCite2Urn(urnString2);

        if (!p1.valid || !p2.valid) return false;
        if (p1.namespace !== p2.namespace) return false;

        const p1CollectionActualParts = [p1.collectionParts.collectionid, p1.collectionParts.versionid, p1.collectionParts.propertyid].filter(Boolean);
        const p2CollectionActualParts = [p2.collectionParts.collectionid, p2.collectionParts.versionid, p2.collectionParts.propertyid].filter(Boolean);
        if (!_areComponentPartsCongruent(p1CollectionActualParts, p2CollectionActualParts)) return false;
        
        return true; // Object component is not part of CITE2 congruence
    }

    // --- EXPORT PUBLIC API ---
    exports.parseCtsUrn = parseCtsUrn;
    exports.isValidCtsUrn = isValidCtsUrn;
    exports.ctsnamespace = ctsnamespace;
    exports.workcomponent = workcomponent;
    exports.passagecomponent = passagecomponent;
    exports.textgroup = textgroup;
    exports.workid = workid;
    exports.version = version; // CTS work version
    exports.exemplar = exemplar;
    exports.areCtsUrnsEqual = areCtsUrnsEqual;
    exports.areCtsUrnsCongruent = areCtsUrnsCongruent;
    exports.retrieveCtsPassages = retrieveCtsPassages;

    exports.parseCite2Urn = parseCite2Urn;
    exports.isValidCite2Urn = isValidCite2Urn;
    exports.cite2namespace = cite2namespace;
    exports.collectioncomponent = collectioncomponent;
    exports.objectcomponent = objectcomponent;
    exports.collectionid = collectionid;
    exports.versionid = versionid; // CITE2 collection version
    exports.propertyid = propertyid;
    exports.areCite2UrnsEqual = areCite2UrnsEqual;
    exports.areCite2UrnsCongruent = areCite2UrnsCongruent;

}(typeof exports === 'undefined' ? (this.URNTools = {}) : exports));