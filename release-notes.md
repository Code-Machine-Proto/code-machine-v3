## [3.1.2](https://github.com/Code-Machine-Proto/code-machine-v3/compare/v3.1.1...v3.1.2) (2026-11-18)


### Bug Fixes

* autoscroll only code editor and not whole view ([#47](https://github.com/Code-Machine-Proto/code-machine-v3/issues/47)) ([da1a400](https://github.com/Code-Machine-Proto/code-machine-v3/commit/da1a4004b3193265fd0a1e08de3907452f053bf0))
* highlight accessed polyrisc registers ([#50](https://github.com/Code-Machine-Proto/code-machine-v3/issues/50)) ([5bb3106](https://github.com/Code-Machine-Proto/code-machine-v3/commit/5bb31061675b06ce19bb2ea10b20ca40f05b67a2))
* highlight polyrisc data memory on ld and st ([#49](https://github.com/Code-Machine-Proto/code-machine-v3/issues/49)) ([a96a059](https://github.com/Code-Machine-Proto/code-machine-v3/commit/a96a059098ed5d00be0603b67fb1716e040b7e52))
* make memory offset header sticky ([#48](https://github.com/Code-Machine-Proto/code-machine-v3/issues/48)) ([0eda6cd](https://github.com/Code-Machine-Proto/code-machine-v3/commit/0eda6cd14a383f228c9aff2914c7712a34d41cab))
* order PolyRisc ALU flags and color registers ([#43](https://github.com/Code-Machine-Proto/code-machine-v3/issues/43)) ([244eafe](https://github.com/Code-Machine-Proto/code-machine-v3/commit/244eafec7bb710ac9696fd773c0c785dd514685c))
* release assets with explicit os names ([#54](https://github.com/Code-Machine-Proto/code-machine-v3/issues/54)) ([cb81e2d](https://github.com/Code-Machine-Proto/code-machine-v3/commit/cb81e2d55b0aba8b2e96f46bd7572f61eecc094e))
* signal colors of memory and register box when on ([#46](https://github.com/Code-Machine-Proto/code-machine-v3/issues/46)) ([f4a0d8a](https://github.com/Code-Machine-Proto/code-machine-v3/commit/f4a0d8adcb17763873a82a913b086990044e7e44))
* switch to execution mode continues instruction instead of restarting ([#44](https://github.com/Code-Machine-Proto/code-machine-v3/issues/44)) ([e896bbe](https://github.com/Code-Machine-Proto/code-machine-v3/commit/e896bbea7862f7b27daae73ce3ca73b21a732d7b))
* syntax error on lack of commas, parenthesis and code sections ([#51](https://github.com/Code-Machine-Proto/code-machine-v3/issues/51)) ([f94acd3](https://github.com/Code-Machine-Proto/code-machine-v3/commit/f94acd375cc449066051b02222373ae18ce32811))
* update register and memory on rising edge ([#53](https://github.com/Code-Machine-Proto/code-machine-v3/issues/53)) ([fc3e0f9](https://github.com/Code-Machine-Proto/code-machine-v3/commit/fc3e0f9b58399b5a1367da1319b3cc446548c157))

## [3.1.1](https://github.com/Code-Machine-Proto/code-machine-v3/compare/v3.1.0...v3.1.1) (2026-09-21)


### Bug Fixes

* full page zoom and mode placement ([#26](https://github.com/Code-Machine-Proto/code-machine-v3/issues/26)) ([9cc61a2](https://github.com/Code-Machine-Proto/code-machine-v3/commit/9cc61a21e367148c7c6e96fbd05364d9f4ab7974))

# [3.1.0](https://github.com/Code-Machine-Proto/code-machine-v3/compare/v3.0.0...v3.1.0) (2026-09-14)


### Bug Fixes

* broken relative paths ([3b34558](https://github.com/Code-Machine-Proto/code-machine-v3/commit/3b345585d20e8939d6571b620917cd9a2d036de6))
* ci ([#13](https://github.com/Code-Machine-Proto/code-machine-v3/issues/13)) ([4a37579](https://github.com/Code-Machine-Proto/code-machine-v3/commit/4a37579f8f62f936dfdeeb7aa67a5a05c2512ad8))
* display polyrisc data and instruction memory ([#24](https://github.com/Code-Machine-Proto/code-machine-v3/issues/24)) ([95415e6](https://github.com/Code-Machine-Proto/code-machine-v3/commit/95415e6f25fe3d0586ce99bfc634004340d6d5eb))
* release ci ([c1250ed](https://github.com/Code-Machine-Proto/code-machine-v3/commit/c1250eda60c65afd30d85a71d6129b32ce9e9a60))


### Features

* add compilation status badge ([#19](https://github.com/Code-Machine-Proto/code-machine-v3/issues/19)) ([261e5d7](https://github.com/Code-Machine-Proto/code-machine-v3/commit/261e5d7336a51ff4524415674d481a8a41a0aeef))
* add execution mode ([#20](https://github.com/Code-Machine-Proto/code-machine-v3/issues/20)) ([8e26b69](https://github.com/Code-Machine-Proto/code-machine-v3/commit/8e26b695a2dcaf87ce679cae9710ec46069720b8))
* add more unit tests for base instructions ([#14](https://github.com/Code-Machine-Proto/code-machine-v3/issues/14)) ([0ae1adf](https://github.com/Code-Machine-Proto/code-machine-v3/commit/0ae1adf74669a3198cf2979420b9da9b932b7d08))
* correct ma instructions and add lea datapath ([#15](https://github.com/Code-Machine-Proto/code-machine-v3/issues/15)) ([800981f](https://github.com/Code-Machine-Proto/code-machine-v3/commit/800981f19081cd2fd24074fa425fd0d8596d864f))
* raise max cycles to 4096 for all architectures ([#18](https://github.com/Code-Machine-Proto/code-machine-v3/issues/18)) ([43be500](https://github.com/Code-Machine-Proto/code-machine-v3/commit/43be5008c9a739221fd202db799dd50ab623ce64))
* save and load code files ([#17](https://github.com/Code-Machine-Proto/code-machine-v3/issues/17)) ([03c1d06](https://github.com/Code-Machine-Proto/code-machine-v3/commit/03c1d0653c63fba61001b99ca964f4e980852569))
* sync line highlight with current cycle instruction ([#16](https://github.com/Code-Machine-Proto/code-machine-v3/issues/16)) ([e046cce](https://github.com/Code-Machine-Proto/code-machine-v3/commit/e046cceeeda5dccbff85cc0f23c59a6dbb6541d8))
* update guide for v3 ([#22](https://github.com/Code-Machine-Proto/code-machine-v3/issues/22)) ([ac3e715](https://github.com/Code-Machine-Proto/code-machine-v3/commit/ac3e7150dc1f15afbe8c73bb4fca60a9590383dd))
