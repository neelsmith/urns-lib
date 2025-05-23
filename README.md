# A vibecoded javascript library for working with CTS and CITE2 URNs




> `urn-lib.js` provides tools for parsing, validating, comparing, and retrieving data associated with CTS (Canonical Text Services) URNs and CITE2 URNs.



## Motivation

URNs are a good fit for the requirements of scholarly citation of long-lived resources.





The javascript library in [urn-lib-lib.js](./urn-lib.js) is designed to simplify using canonical references in a web browser or other javascript environment. The library is fully documented in [this markdown file](./apis.md).




## Contents of this repository

In addition to the library itself (`urn-lib.js`) and the documentation (`apis.md`), this repository includes the following web apps illustrating the library's functionality.

- [1.cite2-urn-inspector.html](./1.cite2-urn-inspector.html): A simple web app that allows you to enter and analyze a pair of CITE2 URNs.
- [1.cts-urn-inspector.html](./1.cts-urn-inspector.html): A simple web app that allows you to enter and analyze a pair of CTS URNs.
- [5.cts-retrieval.html](./5.cts-retrieval.html): A web app that allows you to enter a CTS and retrieve passages from an online corpus.
- [6.cite2-retrieval.html](./6.cite2-retrieval.html): A web app that allows you to enter CITE2 URNs and retrieve passages from a delimited-text source with objects identifeid by CITE2 URNs



## Caveats and technical information

I built this library, but I don't (and won't) write javascript, so I gave in completely to what Anrej Karpathy has called [vibe coding](https://x.com/karpathy/status/1886192184808149383?lang=en). The javascript, the markdown documentation (including the quoted summary at the top of this page), and the illustrative HTML page were all written by gemini-2.5-pro. I've made sure that the library passes a handful of sanity tests, but I have not looked at the code at all. When I ran into errors, I let gemini fix them. Use the code as you like, but be aware that I have no idea what it does or how it works.


### How I build it

If you're curious about how I built the library, the file `chat.txt` has a complete transcript of the conversation I had with gemini-2.5-pro. The `stages` directory has the functioning intermediate versions of the library. The numbers in the filenames correspond to the sequence of the library in the conversation, culminating in `urn-lib-6.js`, which is the final version of the library, and identical to `urn-lib.js` in this repository. 


## License

This repository is licensed under the [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) license. You can use the code in this repository for any purpose, but you must include a copy of the GPL-3.0 license in any distribution of the code or derivative works. See the [LICENSE](./LICENSE) file for more details.