(function(exports) {
    'use strict';

    // --- HELPER FUNCTIONS ---

    function _splitComponentString(componentStr) {
        if (componentStr === "") return [];
        const parts = componentStr.split('.');
        if (parts.some(p => p === "")) return null;
        return parts;
    }

    function _areComponentPartsCongruent(parts1, parts2) {
        if (!parts1 || !parts2) return false;
        const minLen = Math.min(parts1.length, parts2.length);
        for (let i = 0; i < minLen; i++) {
            if (parts1[i] !== parts2[i]) {
                return false;
            }
        }
        return true;
    }

    function _isHierarchicalPrefix(searchParts, corpusParts) {
        if (!searchParts || !corpusParts) return false;
        if (searchParts.length === 0) return true;
        if (searchParts.length > corpusParts.length) return false;
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
            valid: false, original: urnString, error: null, protocol: null, nid: null, namespace: null,
            workComponent: null, passageComponent: null,
            workParts: { textgroup: null, workid: null, version: null, exemplar: null },
            passageParts: { isRange: false, reference: null, referenceParts: [], start: null, startParts: [], end: null, endParts: [] }
        };

        if (typeof urnString !== 'string') {
            result.error = "Input is not a string."; return result;
        }
        const parts = urnString.split(':');
        if (parts.length !== 5) {
            result.error = "CTS URN must have 5 colon-delimited components."; return result;
        }
        result.protocol = parts[0]; result.nid = parts[1]; result.namespace = parts[2];
        result.workComponent = parts[3]; result.passageComponent = parts[4];

        if (result.protocol !== 'urn') { result.error = "Component 1 must be 'urn'."; return result; }
        if (result.nid !== 'cts') { result.error = "Component 2 must be 'cts'."; return result; }
        if (!result.namespace) { result.error = "Component 3 (namespace) must be non-empty."; return result; }
        if (!result.workComponent) { result.error = "Component 4 (work component) must be non-empty."; return result; }

        const workComponentParts = _splitComponentString(result.workComponent);
        if (!workComponentParts || workComponentParts.length === 0 || workComponentParts.length > 4) {
            result.error = "Work component must have 1-4 non-empty, period-separated parts."; return result;
        }
        result.workParts.textgroup = workComponentParts[0] || null;
        result.workParts.workid = workComponentParts[1] || null;
        result.workParts.version = workComponentParts[2] || null;
        result.workParts.exemplar = workComponentParts[3] || null;

        const passageStr = result.passageComponent;
        if (passageStr.includes('-')) {
            const rangePartsArr = passageStr.split('-');
            if (rangePartsArr.length !== 2 || !rangePartsArr[0] || !rangePartsArr[1]) {
                result.error = "Passage range must have a non-empty start and end, separated by one hyphen."; return result;
            }
            result.passageParts.start = rangePartsArr[0];
            result.passageParts.end = rangePartsArr[1];
            const startPsgParts = _splitComponentString(result.passageParts.start);
            const endPsgParts = _splitComponentString(result.passageParts.end);
            if (!startPsgParts || startPsgParts.length === 0) { result.error = "Range start identifier must have at least one non-empty part."; return result; }
            if (!endPsgParts || endPsgParts.length === 0) { result.error = "Range end identifier must have at least one non-empty part."; return result; }
            result.passageParts.isRange = true;
            result.passageParts.startParts = startPsgParts;
            result.passageParts.endParts = endPsgParts;
        } else if (passageStr === "") {
            result.passageParts.isRange = false; result.passageParts.reference = ""; result.passageParts.referenceParts = [];
        } else {
            const singlePsgParts = _splitComponentString(passageStr);
            if (!singlePsgParts || singlePsgParts.length === 0) {
                result.error = "Non-empty, non-range passage identifier must have at least one non-empty part."; return result;
            }
            result.passageParts.isRange = false; result.passageParts.reference = passageStr; result.passageParts.referenceParts = singlePsgParts;
        }
        result.valid = true; return result;
    }

    function isValidCtsUrn(urnString) { return parseCtsUrn(urnString).valid; }
    function ctsnamespace(urnString) { const p = parseCtsUrn(urnString); return p.valid ? p.namespace : null; }
    function workcomponent(urnString) { const p = parseCtsUrn(urnString); return p.valid ? p.workComponent : null; }
    function passagecomponent(urnString) { const p = parseCtsUrn(urnString); return p.valid ? p.passageComponent : null; }
    function textgroup(urnString) { const p = parseCtsUrn(urnString); return p.valid ? p.workParts.textgroup : null; }
    function workid(urnString) { const p = parseCtsUrn(urnString); return p.valid ? p.workParts.workid : null; }
    function version(urnString) { const p = parseCtsUrn(urnString); return p.valid ? p.workParts.version : null; }
    function exemplar(urnString) { const p = parseCtsUrn(urnString); return p.valid ? p.workParts.exemplar : null; }

    function areCtsUrnsEqual(urnString1, urnString2) {
        const p1 = parseCtsUrn(urnString1); const p2 = parseCtsUrn(urnString2);
        if (!p1.valid || !p2.valid) return false;
        return p1.namespace === p2.namespace && p1.workComponent === p2.workComponent && p1.passageComponent === p2.passageComponent;
    }

    function areCtsUrnsCongruent(urnString1, urnString2) {
        const p1 = parseCtsUrn(urnString1); const p2 = parseCtsUrn(urnString2);
        if (!p1.valid || !p2.valid) return false;
        if (p1.namespace !== p2.namespace) return false;
        const p1WParts = [p1.workParts.textgroup,p1.workParts.workid,p1.workParts.version,p1.workParts.exemplar].filter(Boolean);
        const p2WParts = [p2.workParts.textgroup,p2.workParts.workid,p2.workParts.version,p2.workParts.exemplar].filter(Boolean);
        if (!_areComponentPartsCongruent(p1WParts, p2WParts)) return false;
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
        if (!searchUrnObj.valid) { console.error("Invalid search URN:", searchUrnObj.error); return []; }

        const lines = corpusDataString.split('\n');
        const results = [];
        const dataLines = lines.slice(1);

        const searchWorkPartsArray = [searchUrnObj.workParts.textgroup, searchUrnObj.workParts.workid, searchUrnObj.workParts.version, searchUrnObj.workParts.exemplar].filter(p => p !== null && p !== undefined);

        if (searchUrnObj.passageParts.isRange) {
            // New range logic
            const potentialMatches = [];
            for (let i = 0; i < dataLines.length; i++) {
                const line = dataLines[i];
                if (line.trim() === "") continue;
                const parts = line.split('|');
                if (parts.length < 2) continue;
                const corpusUrnString = parts[0].trim();
                const textContent = parts.slice(1).join('|').trim();
                const corpusUrnObj = parseCtsUrn(corpusUrnString);

                if (!corpusUrnObj.valid || corpusUrnObj.passageParts.isRange) continue; // Only match single passages in corpus

                if (searchUrnObj.namespace !== corpusUrnObj.namespace) continue;
                const corpusWorkPartsArray = [corpusUrnObj.workParts.textgroup, corpusUrnObj.workParts.workid, corpusUrnObj.workParts.version, corpusUrnObj.workParts.exemplar].filter(p => p !== null && p !== undefined);
                if (!_isHierarchicalPrefix(searchWorkPartsArray, corpusWorkPartsArray)) continue;
                
                // If we reach here, namespace and work match. Store it with its original index.
                potentialMatches.push({
                    urnString: corpusUrnString,
                    textContent: textContent,
                    urnObj: corpusUrnObj,
                    originalIndex: i // Index in dataLines
                });
            }

            let startIndex = -1;
            let endIndex = -1;

            // Find actual start passage in corpus
            for (let i = 0; i < potentialMatches.length; i++) {
                const pm = potentialMatches[i];
                if (_isHierarchicalPrefix(searchUrnObj.passageParts.startParts, pm.urnObj.passageParts.referenceParts)) {
                    startIndex = i;
                    break; 
                }
            }

            // Find actual end passage in corpus
            // Iterate from end of potential matches to find the LATEST one that matches the end criteria
            for (let i = potentialMatches.length - 1; i >= 0; i--) {
                const pm = potentialMatches[i];
                 // The end passage of the search range must be a prefix of or equal to the corpus passage.
                 // More accurately, the corpus passage must be hierarchically contained within or equal to the search range's end.
                if (_isHierarchicalPrefix(searchUrnObj.passageParts.endParts, pm.urnObj.passageParts.referenceParts)) {
                    // We need to ensure we find the LAST passage in the corpus that falls under this container.
                    // So, we continue searching until _isHierarchicalPrefix is FALSE, and take the one BEFORE that.
                    // This logic is tricky. A simpler approach: find all matches for endParts, take the last one.
                    // Let's refine: the END of the range is the LAST passage whose reference is prefixed by endParts.
                    // No, it's the LAST passage for which the ENDPARTS is a prefix of the passage's parts.
                    // Example: search range ends in '2'. Corpus has 2.1, 2.2, 2.25, 3.1. We want 2.25.
                    endIndex = i; // This is the index in potentialMatches
                    break; 
                }
            }
            
            // Correction for End Index:
            // The previous loop for `endIndex` finds the *last* entry in `potentialMatches` whose passage is prefixed by `searchUrnObj.passageParts.endParts`.
            // This is generally correct. E.g., if range end is '1', and corpus has '1.1', '1.2', '1.title', '2.1',
            // it would correctly pick '1.title' if that's the last '1.x' entry.

            if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
                for (let i = startIndex; i <= endIndex; i++) {
                    results.push({ urn: potentialMatches[i].urnString, text: potentialMatches[i].textContent });
                }
            }

        } else { // Single passage or container search (non-range)
            for (const line of dataLines) {
                if (line.trim() === "") continue;
                const parts = line.split('|');
                if (parts.length < 2) continue;
                const corpusUrnString = parts[0].trim();
                const textContent = parts.slice(1).join('|').trim();
                const corpusUrnObj = parseCtsUrn(corpusUrnString);

                if (!corpusUrnObj.valid || corpusUrnObj.passageParts.isRange) continue;
                if (searchUrnObj.namespace !== corpusUrnObj.namespace) continue;
                const corpusWorkPartsArray = [corpusUrnObj.workParts.textgroup, corpusUrnObj.workParts.workid, corpusUrnObj.workParts.version, corpusUrnObj.workParts.exemplar].filter(p => p !== null && p !== undefined);
                if (!_isHierarchicalPrefix(searchWorkPartsArray, corpusWorkPartsArray)) continue;
                
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
            valid: false, original: urnString, error: null, protocol: null, nid: null, namespace: null,
            collectionComponent: null, objectComponent: null,
            collectionParts: { collectionid: null, versionid: null, propertyid: null },
            objectParts: { isRange: false, reference: null, start: null, end: null }
        };
        if (typeof urnString !== 'string') { result.error = "Input is not a string."; return result; }
        const parts = urnString.split(':');
        if (parts.length !== 5) { result.error = "CITE2 URN must have 5 colon-delimited components."; return result; }
        result.protocol = parts[0]; result.nid = parts[1]; result.namespace = parts[2];
        result.collectionComponent = parts[3]; result.objectComponent = parts[4];

        if (result.protocol !== 'urn') { result.error = "Component 1 must be 'urn'."; return result; }
        if (result.nid !== 'cite2') { result.error = "Component 2 must be 'cite2'."; return result; }
        if (!result.namespace) { result.error = "Component 3 (namespace) must be non-empty."; return result; }
        if (!result.collectionComponent) { result.error = "Component 4 (collection component) must be non-empty."; return result; }

        const collCompParts = _splitComponentString(result.collectionComponent);
        if (!collCompParts || collCompParts.length === 0 || collCompParts.length > 3) {
            result.error = "Collection component must have 1-3 non-empty, period-separated parts."; return result;
        }
        result.collectionParts.collectionid = collCompParts[0] || null;
        result.collectionParts.versionid = collCompParts[1] || null;
        result.collectionParts.propertyid = collCompParts[2] || null;

        const objectStr = result.objectComponent;
        if (objectStr.includes('-')) {
            const rangePartsArr = objectStr.split('-');
            if (rangePartsArr.length !== 2 || !rangePartsArr[0] || !rangePartsArr[1] || rangePartsArr[0].includes('-') || rangePartsArr[1].includes('-')) {
                result.error = "Object component range must have a non-empty start and end, separated by one hyphen. Start/end cannot contain hyphens."; return result;
            }
            result.objectParts.isRange = true; result.objectParts.start = rangePartsArr[0]; result.objectParts.end = rangePartsArr[1];
        } else if (objectStr === "") {
            result.objectParts.isRange = false; result.objectParts.reference = "";
        } else {
            if (objectStr.includes('-')) { result.error = "Single object identifier cannot contain a hyphen."; return result; }
            result.objectParts.isRange = false; result.objectParts.reference = objectStr;
        }
        result.valid = true; return result;
    }

    function isValidCite2Urn(urnString) { return parseCite2Urn(urnString).valid; }
    function cite2namespace(urnString) { const p = parseCite2Urn(urnString); return p.valid ? p.namespace : null; }
    function collectioncomponent(urnString) { const p = parseCite2Urn(urnString); return p.valid ? p.collectionComponent : null; }
    function objectcomponent(urnString) { const p = parseCite2Urn(urnString); return p.valid ? p.objectComponent : null; }
    function collectionid(urnString) { const p = parseCite2Urn(urnString); return p.valid ? p.collectionParts.collectionid : null; }
    function versionid(urnString) { const p = parseCite2Urn(urnString); return p.valid ? p.collectionParts.versionid : null; }
    function propertyid(urnString) { const p = parseCite2Urn(urnString); return p.valid ? p.collectionParts.propertyid : null; }

    function areCite2UrnsEqual(urnString1, urnString2) {
        const p1 = parseCite2Urn(urnString1); const p2 = parseCite2Urn(urnString2);
        if (!p1.valid || !p2.valid) return false;
        return p1.namespace === p2.namespace && p1.collectionComponent === p2.collectionComponent && p1.objectComponent === p2.objectComponent;
    }

    function areCite2UrnsCongruent(urnString1, urnString2) {
        const p1 = parseCite2Urn(urnString1); const p2 = parseCite2Urn(urnString2);
        if (!p1.valid || !p2.valid) return false;
        if (p1.namespace !== p2.namespace) return false;
        const p1CollActParts = [p1.collectionParts.collectionid, p1.collectionParts.versionid, p1.collectionParts.propertyid].filter(Boolean);
        const p2CollActParts = [p2.collectionParts.collectionid, p2.collectionParts.versionid, p2.collectionParts.propertyid].filter(Boolean);
        if (!_areComponentPartsCongruent(p1CollActParts, p2CollActParts)) return false;
        return true;
    }

    exports.parseCtsUrn = parseCtsUrn;
    exports.isValidCtsUrn = isValidCtsUrn;
    exports.ctsnamespace = ctsnamespace;
    exports.workcomponent = workcomponent;
    exports.passagecomponent = passagecomponent;
    exports.textgroup = textgroup;
    exports.workid = workid;
    exports.version = version;
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
    exports.versionid = versionid;
    exports.propertyid = propertyid;
    exports.areCite2UrnsEqual = areCite2UrnsEqual;
    exports.areCite2UrnsCongruent = areCite2UrnsCongruent;

}(typeof exports === 'undefined' ? (this.URNTools = {}) : exports));