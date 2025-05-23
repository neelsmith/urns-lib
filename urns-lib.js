// cts-urn.js
const CTSURN = (function() {

    // --- Private Helper Function: Parser ---
    // Returns a parsed object or null if invalid.
    function _parseCtsUrn(urnString) {
        if (typeof urnString !== 'string') {
            return null;
        }

        const parts = urnString.split(':');
        if (parts.length !== 5) {
            return null; // Must have 5 colon-delimited components
        }

        const [urnLiteral, ctsLiteral, namespace, workComp, passageComp] = parts;

        if (urnLiteral !== 'urn' || ctsLiteral !== 'cts') {
            return null; // Must start with "urn:cts:"
        }

        // 3. Namespace: non-empty
        if (namespace === '') {
            return null;
        }

        // 4. Work component: non-empty, 1-4 period-separated parts, parts cannot be empty
        if (workComp === '') {
            return null;
        }
        const workPartsRaw = workComp.split('.');
        if (workPartsRaw.length < 1 || workPartsRaw.length > 4) {
            return null; // 1 to 4 parts
        }
        if (workPartsRaw.some(p => p === '')) { // No empty parts like "tg..w" or ".w" or "tg."
             return null;
        }
        const workP = {
            textgroup: workPartsRaw[0] || null, // textgroup is required
            workid: workPartsRaw[1] || null,
            version: workPartsRaw[2] || null,
            exemplar: workPartsRaw[3] || null,
        };


        // 5. Passage component: possibly empty.
        // If non-empty:
        //   a) passage reference: 1+ period-separated parts, parts cannot be empty
        //   b) range: two passage references (adhering to 'a') joined by a hyphen.
        //      Hyphen and period cannot be part of node identifiers themselves.
        let passageDetails = {
            type: 'empty',
            value: null,
            rangeStart: null,
            rangeEnd: null,
            isRange: false,
        };

        if (passageComp !== '') {
            if (passageComp.includes('-')) {
                const rangeSubParts = passageComp.split('-');
                // Must be exactly two parts for a range, and neither part can be empty.
                if (rangeSubParts.length !== 2 || rangeSubParts[0] === '' || rangeSubParts[1] === '') {
                    return null; // Invalid range format
                }
                const [startRef, endRef] = rangeSubParts;

                const startRefParts = startRef.split('.');
                if (startRefParts.length < 1 || startRefParts.some(p => p === '')) {
                    return null; // Invalid start passage reference
                }
                const endRefParts = endRef.split('.');
                if (endRefParts.length < 1 || endRefParts.some(p => p === '')) {
                    return null; // Invalid end passage reference
                }
                passageDetails = {
                    type: 'range',
                    value: passageComp,
                    rangeStart: startRef,
                    rangeEnd: endRef,
                    isRange: true,
                };
            } else { // Single passage reference
                const passageRefParts = passageComp.split('.');
                if (passageRefParts.length < 1 || passageRefParts.some(p => p === '')) {
                    return null; // Invalid passage reference
                }
                passageDetails = {
                    type: 'single',
                    value: passageComp,
                    rangeStart: null,
                    rangeEnd: null,
                    isRange: false,
                };
            }
        }

        return {
            original: urnString,
            namespace: namespace,
            workComponent: workComp,
            passageComponent: passageComp,
            workParts: workP,
            passageDetails: passageDetails
        };
    }

    // --- Private Helper for Congruence: Get passage sub-parts ---
    function _getPassageSubParts(passageRefStr) {
        if (!passageRefStr) return []; // Handles null or empty string from parser
        return passageRefStr.split('.');
    }

    // --- Private Helper: Check work component congruence for retrieval ---
    // Data work must be AT LEAST AS SPECIFIC as input work, matching all defined input parts.
    function _checkWorkCongruenceForRetrieval(inputWorkP, dataWorkP) {
        const workLevels = ['textgroup', 'workid', 'version', 'exemplar'];
        for (const level of workLevels) {
            if (inputWorkP[level] !== null) { // If input defines this level
                if (dataWorkP[level] === null || inputWorkP[level] !== dataWorkP[level]) {
                    return false; // Data must also define it and they must match
                }
            } else {
                // Input is less specific from this point. Data can have further specification.
                // This means all preceding defined parts of input matched.
                return true;
            }
        }
        return true; // All levels matched or input was fully specified and matched.
    }


    // --- Public API ---
    const publicApi = {
        isValidCtsUrn: function(urnString) {
            return _parseCtsUrn(urnString) !== null;
        },

        ctsnamespace: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.namespace : null;
        },

        workcomponent: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.workComponent : null;
        },

        passagecomponent: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.passageComponent : null;
        },

        textgroup: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.workParts.textgroup : null;
        },

        workid: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.workParts.workid : null;
        },

        version: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.workParts.version : null;
        },

        exemplar: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.workParts.exemplar : null;
        },

        isRange: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed ? parsed.passageDetails.isRange : false;
        },
        
        getPassageRangeStart: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed && parsed.passageDetails.isRange ? parsed.passageDetails.rangeStart : null;
        },

        getPassageRangeEnd: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            return parsed && parsed.passageDetails.isRange ? parsed.passageDetails.rangeEnd : null;
        },

        areEqualCtsUrns: function(urnString1, urnString2) {
            const parsed1 = _parseCtsUrn(urnString1);
            const parsed2 = _parseCtsUrn(urnString2);

            if (!parsed1 || !parsed2) { // Both must be valid to be equal as URNs
                return false;
            }
            // Equality means all 3 key variable components are identical strings
            return parsed1.namespace === parsed2.namespace &&
                   parsed1.workComponent === parsed2.workComponent &&
                   parsed1.passageComponent === parsed2.passageComponent;
        },

        areCongruentCtsUrns: function(urnString1, urnString2) {
            const parsed1 = _parseCtsUrn(urnString1);
            const parsed2 = _parseCtsUrn(urnString2);

            if (!parsed1 || !parsed2) { // Both must be valid
                return false;
            }

            // 1. Same namespace
            if (parsed1.namespace !== parsed2.namespace) {
                return false;
            }

            // 2. Work component congruence:
            // Each period-separated part that is present is equal to the same part in the other URN.
            const workP1 = parsed1.workParts;
            const workP2 = parsed2.workParts;
            const workLevels = ['textgroup', 'workid', 'version', 'exemplar'];

            for (const level of workLevels) {
                if (workP1[level] !== null && workP2[level] !== null) {
                    if (workP1[level] !== workP2[level]) return false; // Mismatch at defined level
                } else if (workP1[level] === null && workP2[level] === null) {
                    // Both are null, continue (or break, as further levels also null)
                    break; 
                } else {
                    // One has a value, other doesn't. This is fine for congruence. e.g., tg.w vs tg.w.v
                    break; 
                }
            }
            
            // 3. Passage component congruence:
            const pD1 = parsed1.passageDetails; // passageDetails1
            const pD2 = parsed2.passageDetails; // passageDetails2

            // If one is empty and the other is not, they are not congruent.
            if (pD1.type === 'empty' && pD2.type === 'empty') {
                // Both empty: congruent passage.
            } else if (pD1.type === 'empty' || pD2.type === 'empty') {
                return false; // One empty, one not: not congruent.
            }
            // If types differ (e.g., single vs range), not congruent.
            else if (pD1.type !== pD2.type) {
                return false;
            }
            // Both are 'single' or both are 'range'.
            else if (pD1.type === 'single') { // Both 'single'
                const pass1Parts = _getPassageSubParts(pD1.value);
                const pass2Parts = _getPassageSubParts(pD2.value);
                const minLength = Math.min(pass1Parts.length, pass2Parts.length);
                for (let i = 0; i < minLength; i++) {
                    if (pass1Parts[i] !== pass2Parts[i]) return false;
                }
            } else { // Both 'range'
                // Compare start points for congruence
                const start1Parts = _getPassageSubParts(pD1.rangeStart);
                const start2Parts = _getPassageSubParts(pD2.rangeStart);
                let minLength = Math.min(start1Parts.length, start2Parts.length);
                for (let i = 0; i < minLength; i++) {
                    if (start1Parts[i] !== start2Parts[i]) return false;
                }
                // Compare end points for congruence
                const end1Parts = _getPassageSubParts(pD1.rangeEnd);
                const end2Parts = _getPassageSubParts(pD2.rangeEnd);
                minLength = Math.min(end1Parts.length, end2Parts.length);
                for (let i = 0; i < minLength; i++) {
                    if (end1Parts[i] !== end2Parts[i]) return false;
                }
            }
            // If all checks passed
            return true;
        },

        getFullCtsUrnDetails: function(urnString) {
            const parsed = _parseCtsUrn(urnString);
            if (!parsed) {
                return {
                    isValid: false,
                    original: urnString,
                };
            }
            return {
                isValid: true,
                original: urnString,
                namespace: parsed.namespace,
                textgroup: parsed.workParts.textgroup,
                workid: parsed.workParts.workid || '', // Use empty string for display consistency
                version: parsed.workParts.version || '',
                exemplar: parsed.workParts.exemplar || '',
                passageComponent: parsed.passageComponent,
                isRange: parsed.passageDetails.isRange,
                rangeStart: parsed.passageDetails.rangeStart,
                rangeEnd: parsed.passageDetails.rangeEnd,
                passageType: parsed.passageDetails.type,
                // Expose parsed object for advanced use like retrieval
                _parsed: parsed 
            };
        },

        retrievePassages: function(inputUrnString, delimitedTextData, delimiter = '|') {
            const inputDetails = this.getFullCtsUrnDetails(inputUrnString);
            if (!inputDetails.isValid) {
                console.error("Input URN for retrieval is invalid:", inputUrnString);
                return [];
            }
            const inputParsed = inputDetails._parsed;

            const results = [];
            const lines = delimitedTextData.split('\n');

            let inRangeMode = false; 
            let rangeStartPassageTarget = null; // Only needed for input type 'range'
            let rangeEndPassageTarget = null;   // Only needed for input type 'range'

            if (inputParsed.passageDetails.type === 'range') {
                rangeStartPassageTarget = inputParsed.passageDetails.rangeStart;
                rangeEndPassageTarget = inputParsed.passageDetails.rangeEnd;
            }

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Strict "skip the first line" as per prompt.
                if (i === 0) {
                    continue; 
                }
                // Also skip general comment/empty lines after the first.
                if (line === '' || line.startsWith('#')) {
                    continue;
                }

                const parts = line.split(delimiter);
                if (parts.length < 2) { // Ensure at least URN and text
                    // console.warn("Skipping malformed line (not enough parts):", line);
                    continue;
                }
                const dataUrnString = parts[0].trim();
                const textContent = parts.slice(1).join(delimiter).trim(); // Handle cases where text might contain delimiter

                const dataDetails = this.getFullCtsUrnDetails(dataUrnString);
                // Data URNs for retrieval must be valid and typically point to single passages.
                // A data URN with an empty passage means it refers to a whole work/version,
                // which isn't a citable "leaf" node in the context of retrieving text passages.
                if (!dataDetails.isValid || dataDetails.passageType === 'range' || (dataDetails.passageType === 'empty' && dataDetails.passageComponent === '')) {
                    // Skip if data URN is invalid, a range itself, or an empty passage (whole work citation)
                    // console.warn("Skipping data URN not suitable for passage retrieval:", dataUrnString);
                    continue;
                }
                 // Specifically, ensure data passage component is not empty for leaf node text.
                if (dataDetails.passageComponent === '') {
                    continue;
                }

                const dataParsed = dataDetails._parsed;

                // 1. Check Namespace
                if (inputParsed.namespace !== dataParsed.namespace) {
                    if (inRangeMode) { // If we were in a range, a namespace mismatch breaks the range.
                        inRangeMode = false;
                    }
                    continue;
                }

                // 2. Check Work Component Congruence
                if (!_checkWorkCongruenceForRetrieval(inputParsed.workParts, dataParsed.workParts)) {
                    if (inRangeMode) { // If we were in a range, a work mismatch breaks the range.
                        inRangeMode = false;
                    }
                    continue;
                }

                // 3. Check Passage Component
                const inputPassageType = inputParsed.passageDetails.type;
                const inputPassageValue = inputParsed.passageComponent; // Can be "" for input
                const dataPassageValue = dataParsed.passageComponent;   // Will not be "" here due to earlier check

                let match = false;

                if (inputPassageType === 'empty') { // Input: urn:cts:group:workid: (requests all passages of the work)
                    // dataPassageValue is guaranteed non-empty here.
                    match = true;
                } else if (inputPassageType === 'single') { // Input: urn:cts:group:workid:1 or ...:1.1
                    // Data passage must be equal or more specific (hierarchically deeper)
                    if (dataPassageValue === inputPassageValue || dataPassageValue.startsWith(inputPassageValue + '.')) {
                        match = true;
                    }
                } else if (inputPassageType === 'range') { // Input: urn:cts:group:workid:START-END
                    const currentDataPassage = dataParsed.passageComponent; // This is dataPassageValue

                    if (!inRangeMode) { // Not yet in the desired range
                        if (currentDataPassage === rangeStartPassageTarget) {
                            inRangeMode = true;
                            match = true; // This line is the start of the range
                        }
                    } else { // Already inRangeMode (currentDataPassage is after rangeStartPassageTarget in file order)
                        match = true; // Include this line as it's part of the ongoing range
                    }

                    // If this line is a match (either start or subsequent) AND it's the end of the range
                    if (match && currentDataPassage === rangeEndPassageTarget) {
                        // It's included, and then we stop being in range mode
                        inRangeMode = false; 
                    }
                    
                    // If inRangeMode is true, but match became false (e.g. due to work/namespace change earlier),
                    // then the range implicitly ended. The inRangeMode reset is handled with work/ns checks.
                }

                if (match) {
                    results.push({ urn: dataUrnString, text: textContent });
                }
            }
            
            return results;
        }
    };
    
    // Note on CITE2 URNs: This library currently focuses on CTS URNs.
    // CITE2 URN functionality is not implemented.
    
    return publicApi;
})();

// Example for Node.js (uncomment if needed for Node environment testing)
// if (typeof module !== 'undefined' && module.exports) {
//    module.exports = CTSURN;
// }