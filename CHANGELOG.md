## [6.29.1](https://github.com/consolelabs/mochi-discord/compare/v6.29.0...v6.29.1) (2023-09-08)

### Bug Fixes

* **general:** re-add new RON emoji ([c3761ad](https://github.com/consolelabs/mochi-discord/commit/c3761ad92218bae460f49e70b317877f9aa7d8f4))

# [6.30.0-rc.1](https://github.com/consolelabs/mochi-discord/compare/v6.29.0...v6.30.0-rc.1) (2023-09-08)


### Bug Fixes

* **balance:** user now should see the whitelisted tokens in balance ([66e3d11](https://github.com/consolelabs/mochi-discord/commit/66e3d1167baa462a9473b27338f80d19515d9af5))
* **general:** add home page's link to formatter so it can work properly ([7db78ef](https://github.com/consolelabs/mochi-discord/commit/7db78efed89554e62b52ced87a0a7fd93e46a272))
* **general:** avoid fetching amount of profile data in some scenarios ([9c438cc](https://github.com/consolelabs/mochi-discord/commit/9c438ccfd7ff156a84ec3fa21656a188872ba024))
* **general:** bot to use different config when in prod/preview ([ca1461c](https://github.com/consolelabs/mochi-discord/commit/ca1461c89d7dc15a4ed7964770c819ad7955df7c))
* **guess:** show question in embed ([a039a29](https://github.com/consolelabs/mochi-discord/commit/a039a290fbc9e38954b209a3dff72557d3664b6b))
* **guess:** stop updating a guess game's progress after that game has ended ([de40608](https://github.com/consolelabs/mochi-discord/commit/de40608d1183192d389f8bafc1176fc384a5f566))
* **payme:** pay request payload ([#1479](https://github.com/consolelabs/mochi-discord/issues/1479)) ([2a7bfef](https://github.com/consolelabs/mochi-discord/commit/2a7bfeff43f163aa2b576ec9dd9ab710ba521054))
* **vault:** bug that prevents user from transferring funds in vaults ([5f043fe](https://github.com/consolelabs/mochi-discord/commit/5f043fe9366c389ff3fbad19b93272cf053068dd))
* **v:** reword command description to be more accurate ([b584146](https://github.com/consolelabs/mochi-discord/commit/b584146149262b4090851e4954e35d0df4562505))
* **wlv:** command /wlv to use shared lib to format data ([7e81fbf](https://github.com/consolelabs/mochi-discord/commit/7e81fbfa85052e1e6319945761c760b25d4b193a))


### Features

* **guess:** allow guess game to be played inside a thread or played outside in a channel ([#1478](https://github.com/consolelabs/mochi-discord/issues/1478)) ([42d5fdd](https://github.com/consolelabs/mochi-discord/commit/42d5fddf3f662a75647447d335294bbc55709370))
* **guess:** move game from inside thread to outside channel ([c096936](https://github.com/consolelabs/mochi-discord/commit/c096936582a2b3a3354c3baa7151a18a76178557))
* **sup:** what's new command for user to check out latest changelog ([#1476](https://github.com/consolelabs/mochi-discord/issues/1476)) ([661fc8e](https://github.com/consolelabs/mochi-discord/commit/661fc8e46c18b9f5afbced4659ce2b558853282c))
* **token:** add verbose option to token info command to show additional data ([c581e9e](https://github.com/consolelabs/mochi-discord/commit/c581e9ee02369cd50e062c1754836bbbc05ee278))
* **v:** add command /v to check the bot's current version ([b919be6](https://github.com/consolelabs/mochi-discord/commit/b919be61330b16e0310b7654f286193b5b53b829))

# [6.29.0](https://github.com/consolelabs/mochi-discord/compare/v6.28.4...v6.29.0) (2023-09-08)


### Bug Fixes

* **balance:** user now should see the whitelisted tokens in balance ([ebe68e1](https://github.com/consolelabs/mochi-discord/commit/ebe68e1e05a65295517701d732524a58bef1e7fa))
* crash server ([#1466](https://github.com/consolelabs/mochi-discord/issues/1466)) ([f60546f](https://github.com/consolelabs/mochi-discord/commit/f60546fb6fbac64e5cd39a409f9ece5f0e8bb294))
* fix fail dexpair type ([#1467](https://github.com/consolelabs/mochi-discord/issues/1467)) ([d87c159](https://github.com/consolelabs/mochi-discord/commit/d87c159486ced17b1f49a34905405dd3ba854cbf))
* fix fail dexpair type ([#1467](https://github.com/consolelabs/mochi-discord/issues/1467)) ([#1468](https://github.com/consolelabs/mochi-discord/issues/1468)) ([d6f926c](https://github.com/consolelabs/mochi-discord/commit/d6f926ce42ebb9d619ac1ccda17bb077b3a979f6))
* **general:** bot to use different config when in prod/preview ([52f9e73](https://github.com/consolelabs/mochi-discord/commit/52f9e7348fb47fbc9a4c41545414c411a0796aa4))
* **general:** move missing module from optional to dependency ([45748ec](https://github.com/consolelabs/mochi-discord/commit/45748ec7a5e51f41d16b2741d7c9357ae785e3ab))
* **general:** move missing module from optional to dependency ([6ebb7d0](https://github.com/consolelabs/mochi-discord/commit/6ebb7d014b4fe96290e4a02c68f2c0b70b000820))
* **general:** no_fetch_amount param ([c117015](https://github.com/consolelabs/mochi-discord/commit/c117015808c1db2bc3a9869c4db8bbafd4f4c96c))
* **guess:** stop updating a guess game's progress after that game has ended ([c8d88ec](https://github.com/consolelabs/mochi-discord/commit/c8d88ecbb36a08aae4228e8c78e909308c4da1ae))
* **payme,paylink,balances:** pay request payload ([#1479](https://github.com/consolelabs/mochi-discord/issues/1479)) ([0db6008](https://github.com/consolelabs/mochi-discord/commit/0db6008ec30ca74f618880ee3b6a147ec8874309))
* remove response dexpair type ([#1469](https://github.com/consolelabs/mochi-discord/issues/1469)) ([8441788](https://github.com/consolelabs/mochi-discord/commit/844178815be22ca84f6c26b0147466d501b0922e))
* send more params tip moniker ([#1465](https://github.com/consolelabs/mochi-discord/issues/1465)) ([608e4a3](https://github.com/consolelabs/mochi-discord/commit/608e4a38fbaae34fc24e740c2388d44c374d9711))
* **v:** reword command description to be more accurate ([7902e96](https://github.com/consolelabs/mochi-discord/commit/7902e9691ea4a3483a751284e1bb9ff1ce98b6c0))


### Features

* **guess:** allow guess game to be played inside a thread or played outside in a channel ([#1478](https://github.com/consolelabs/mochi-discord/issues/1478)) ([3d19e32](https://github.com/consolelabs/mochi-discord/commit/3d19e32f1d3da7c6ded94bfe4144ecb772804d5b))
* move game thread to channel ([#1462](https://github.com/consolelabs/mochi-discord/issues/1462)) ([e9931ad](https://github.com/consolelabs/mochi-discord/commit/e9931adce5d8ee826ec6d68e502075ed3780d148))
* **sup:** what's new command for user to check out latest changelog ([#1476](https://github.com/consolelabs/mochi-discord/issues/1476)) ([58d739d](https://github.com/consolelabs/mochi-discord/commit/58d739db6a22d201b2a43f78c354629b81dda47e))
* token verbose ([#1455](https://github.com/consolelabs/mochi-discord/issues/1455)) ([1ae8b26](https://github.com/consolelabs/mochi-discord/commit/1ae8b26899f57d6f7141d3e445394a5dcae9a45c))
* **v:** add command /v to check the bot's current version ([410d851](https://github.com/consolelabs/mochi-discord/commit/410d851823517cb99b0ad61e867b3efad6b3fb30))

# [6.29.0-rc.13](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.12...v6.29.0-rc.13) (2023-09-07)


### Bug Fixes

* **payme,paylink,balances:** pay request payload ([#1479](https://github.com/consolelabs/mochi-discord/issues/1479)) ([0db6008](https://github.com/consolelabs/mochi-discord/commit/0db6008ec30ca74f618880ee3b6a147ec8874309))

# [6.29.0-rc.12](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.11...v6.29.0-rc.12) (2023-09-07)


### Bug Fixes

* **general:** move missing module from optional to dependency ([45748ec](https://github.com/consolelabs/mochi-discord/commit/45748ec7a5e51f41d16b2741d7c9357ae785e3ab))

# [6.29.0-rc.11](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.10...v6.29.0-rc.11) (2023-09-07)


### Bug Fixes

* **general:** move missing module from optional to dependency ([6ebb7d0](https://github.com/consolelabs/mochi-discord/commit/6ebb7d014b4fe96290e4a02c68f2c0b70b000820))

# [6.29.0-rc.10](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.9...v6.29.0-rc.10) (2023-09-07)


### Bug Fixes

* **v:** reword command description to be more accurate ([7902e96](https://github.com/consolelabs/mochi-discord/commit/7902e9691ea4a3483a751284e1bb9ff1ce98b6c0))

# [6.29.0-rc.9](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.8...v6.29.0-rc.9) (2023-09-07)


### Features

* **v:** add command /v to check the bot's current version ([410d851](https://github.com/consolelabs/mochi-discord/commit/410d851823517cb99b0ad61e867b3efad6b3fb30))

# [6.29.0-rc.8](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.7...v6.29.0-rc.8) (2023-09-07)


### Features

* **guess:** allow guess game to be played inside a thread or played outside in a channel ([#1478](https://github.com/consolelabs/mochi-discord/issues/1478)) ([3d19e32](https://github.com/consolelabs/mochi-discord/commit/3d19e32f1d3da7c6ded94bfe4144ecb772804d5b))

# [6.29.0-rc.7](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.6...v6.29.0-rc.7) (2023-09-07)


### Bug Fixes

* **general:** bot to use different config when in prod/preview ([52f9e73](https://github.com/consolelabs/mochi-discord/commit/52f9e7348fb47fbc9a4c41545414c411a0796aa4))

# [6.29.0-rc.6](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.5...v6.29.0-rc.6) (2023-09-06)


### Bug Fixes

* **balance:** user now should see the whitelisted tokens in balance ([ebe68e1](https://github.com/consolelabs/mochi-discord/commit/ebe68e1e05a65295517701d732524a58bef1e7fa))
* **general:** no_fetch_amount param ([c117015](https://github.com/consolelabs/mochi-discord/commit/c117015808c1db2bc3a9869c4db8bbafd4f4c96c))


### Features

* **sup:** what's new command for user to check out latest changelog ([#1476](https://github.com/consolelabs/mochi-discord/issues/1476)) ([58d739d](https://github.com/consolelabs/mochi-discord/commit/58d739db6a22d201b2a43f78c354629b81dda47e))

# [6.29.0-rc.5](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.4...v6.29.0-rc.5) (2023-08-30)

### Bug Fixes

- **guess:** stop updating a guess game's progress after that game has ended ([c8d88ec](https://github.com/consolelabs/mochi-discord/commit/c8d88ecbb36a08aae4228e8c78e909308c4da1ae))

# [6.29.0-rc.4](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.3...v6.29.0-rc.4) (2023-08-29)

### Bug Fixes

- fix fail dexpair type ([#1467](https://github.com/consolelabs/mochi-discord/issues/1467)) ([d87c159](https://github.com/consolelabs/mochi-discord/commit/d87c159486ced17b1f49a34905405dd3ba854cbf))
- remove response dexpair type ([#1469](https://github.com/consolelabs/mochi-discord/issues/1469)) ([8441788](https://github.com/consolelabs/mochi-discord/commit/844178815be22ca84f6c26b0147466d501b0922e))

# [6.29.0-rc.3](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.2...v6.29.0-rc.3) (2023-08-29)

### Bug Fixes

- fix fail dexpair type ([#1467](https://github.com/consolelabs/mochi-discord/issues/1467)) ([#1468](https://github.com/consolelabs/mochi-discord/issues/1468)) ([d6f926c](https://github.com/consolelabs/mochi-discord/commit/d6f926ce42ebb9d619ac1ccda17bb077b3a979f6))

# [6.29.0-rc.2](https://github.com/consolelabs/mochi-discord/compare/v6.29.0-rc.1...v6.29.0-rc.2) (2023-08-29)

### Bug Fixes

- crash server ([#1466](https://github.com/consolelabs/mochi-discord/issues/1466)) ([f60546f](https://github.com/consolelabs/mochi-discord/commit/f60546fb6fbac64e5cd39a409f9ece5f0e8bb294))

# [6.29.0-rc.1](https://github.com/consolelabs/mochi-discord/compare/v6.28.4...v6.29.0-rc.1) (2023-08-29)

### Bug Fixes

- send more params tip moniker ([#1465](https://github.com/consolelabs/mochi-discord/issues/1465)) ([608e4a3](https://github.com/consolelabs/mochi-discord/commit/608e4a38fbaae34fc24e740c2388d44c374d9711))

### Features

- move game thread to channel ([#1462](https://github.com/consolelabs/mochi-discord/issues/1462)) ([e9931ad](https://github.com/consolelabs/mochi-discord/commit/e9931adce5d8ee826ec6d68e502075ed3780d148))
- token verbose ([#1455](https://github.com/consolelabs/mochi-discord/issues/1455)) ([1ae8b26](https://github.com/consolelabs/mochi-discord/commit/1ae8b26899f57d6f7141d3e445394a5dcae9a45c))

## [6.28.4](https://github.com/consolelabs/mochi-discord/compare/v6.28.3...v6.28.4) (2023-08-28)

### Bug Fixes

- /profile assoc account fetch amount ([9468340](https://github.com/consolelabs/mochi-discord/commit/94683407e2645c0cfe40aa7875219e9ecf603d97))

## [6.28.3](https://github.com/consolelabs/mochi-discord/compare/v6.28.2...v6.28.3) (2023-08-23)

### Bug Fixes

- get by discord id noFetchAmount ([1297e96](https://github.com/consolelabs/mochi-discord/commit/1297e961c99a1e1bbe3c5bd70e1f06161dbbae30))
- vault transfer address ([#1463](https://github.com/consolelabs/mochi-discord/issues/1463)) ([795d9bb](https://github.com/consolelabs/mochi-discord/commit/795d9bbd346f2b6b97e52847874bf2dfba3658d4))

## [6.28.3-rc.2](https://github.com/consolelabs/mochi-discord/compare/v6.28.3-rc.1...v6.28.3-rc.2) (2023-08-23)

### Bug Fixes

- vault transfer address ([#1463](https://github.com/consolelabs/mochi-discord/issues/1463)) ([795d9bb](https://github.com/consolelabs/mochi-discord/commit/795d9bbd346f2b6b97e52847874bf2dfba3658d4))

## [6.28.3-rc.1](https://github.com/consolelabs/mochi-discord/compare/v6.28.2...v6.28.3-rc.1) (2023-08-22)

### Bug Fixes

- get by discord id noFetchAmount ([1297e96](https://github.com/consolelabs/mochi-discord/commit/1297e961c99a1e1bbe3c5bd70e1f06161dbbae30))

## [6.28.2](https://github.com/consolelabs/mochi-discord/compare/v6.28.1...v6.28.2) (2023-08-22)

### Bug Fixes

- add back homepageUrl to formatter ([ee3722b](https://github.com/consolelabs/mochi-discord/commit/ee3722b2bc7ed07691f46e5751f7e64bd03a6b8e))
- wlv not using formatter ([a679134](https://github.com/consolelabs/mochi-discord/commit/a679134e8a684688f4fe8b3cfb642e70c0be746d))

## [6.28.2-rc.1](https://github.com/consolelabs/mochi-discord/compare/v6.28.1...v6.28.2-rc.1) (2023-08-22)

### Bug Fixes

- add back homepageUrl to formatter ([ee3722b](https://github.com/consolelabs/mochi-discord/commit/ee3722b2bc7ed07691f46e5751f7e64bd03a6b8e))
- wlv not using formatter ([a679134](https://github.com/consolelabs/mochi-discord/commit/a679134e8a684688f4fe8b3cfb642e70c0be746d))

## [6.28.1](https://github.com/consolelabs/mochi-discord/compare/v6.28.0...v6.28.1) (2023-08-21)

### Bug Fixes

- temp - approve and reject transfer request ([#1461](https://github.com/consolelabs/mochi-discord/issues/1461)) ([3ab850e](https://github.com/consolelabs/mochi-discord/commit/3ab850e6fdecfa23e1c794a180425d07f1fb322f))
- temp - approve and reject transfer request ([#1461](https://github.com/consolelabs/mochi-discord/issues/1461)) ([d3c8d21](https://github.com/consolelabs/mochi-discord/commit/d3c8d213baf9f1c54d36de69fc745b0fd0dbdb00))

# [6.28.0-rc.2](https://github.com/consolelabs/mochi-discord/compare/v6.28.0-rc.1...v6.28.0-rc.2) (2023-08-21)

### Bug Fixes

- temp - approve and reject transfer request ([#1461](https://github.com/consolelabs/mochi-discord/issues/1461)) ([d3c8d21](https://github.com/consolelabs/mochi-discord/commit/d3c8d213baf9f1c54d36de69fc745b0fd0dbdb00))

# [6.28.0](https://github.com/consolelabs/mochi-discord/compare/v6.27.0...v6.28.0) (2023-08-21)

### Bug Fixes

- add game bet amount guess game ([#1459](https://github.com/consolelabs/mochi-discord/issues/1459)) ([5dcf284](https://github.com/consolelabs/mochi-discord/commit/5dcf284555b5b657a610699ab8df5fa58f0d41e4))
- correct packagejson config ([6b7d910](https://github.com/consolelabs/mochi-discord/commit/6b7d9108eb421a9211c9231273790de7ba5531bb))
- guess game timer/timeout typing ([8f3cc30](https://github.com/consolelabs/mochi-discord/commit/8f3cc30b563489e54e10245a28469ef0db15b252))
- improve guess game ([#1457](https://github.com/consolelabs/mochi-discord/issues/1457)) ([5d28a68](https://github.com/consolelabs/mochi-discord/commit/5d28a689f67a1f6ae1fe938b0734d93b89994f60))

### Features

- add v2 preview env ([#1460](https://github.com/consolelabs/mochi-discord/issues/1460)) ([639f5c6](https://github.com/consolelabs/mochi-discord/commit/639f5c6a9633c54eb5dd2c145cb2c66b077a5187))

# [6.28.0-rc.1](https://github.com/consolelabs/mochi-discord/compare/v6.27.1-rc.2...v6.28.0-rc.1) (2023-08-21)

### Bug Fixes

- add game bet amount guess game ([#1459](https://github.com/consolelabs/mochi-discord/issues/1459)) ([5dcf284](https://github.com/consolelabs/mochi-discord/commit/5dcf284555b5b657a610699ab8df5fa58f0d41e4))

### Features

- add v2 preview env ([#1460](https://github.com/consolelabs/mochi-discord/issues/1460)) ([639f5c6](https://github.com/consolelabs/mochi-discord/commit/639f5c6a9633c54eb5dd2c145cb2c66b077a5187))

## [6.27.1-rc.2](https://github.com/consolelabs/mochi-discord/compare/v6.27.1-rc.1...v6.27.1-rc.2) (2023-08-21)

### Bug Fixes

- guess game timer/timeout typing ([8f3cc30](https://github.com/consolelabs/mochi-discord/commit/8f3cc30b563489e54e10245a28469ef0db15b252))

## [6.27.1-rc.1](https://github.com/consolelabs/mochi-discord/compare/v6.27.0...v6.27.1-rc.1) (2023-08-21)

### Bug Fixes

- correct packagejson config ([6b7d910](https://github.com/consolelabs/mochi-discord/commit/6b7d9108eb421a9211c9231273790de7ba5531bb))
- improve guess game ([#1457](https://github.com/consolelabs/mochi-discord/issues/1457)) ([5d28a68](https://github.com/consolelabs/mochi-discord/commit/5d28a689f67a1f6ae1fe938b0734d93b89994f60))

# [6.27.0](https://github.com/consolelabs/mochi-discord/compare/v6.26.6...v6.27.0) (2023-08-18)

### Bug Fixes

- convert ratio ([#1442](https://github.com/consolelabs/mochi-discord/issues/1442)) ([e2fb70b](https://github.com/consolelabs/mochi-discord/commit/e2fb70b477af4b5b86210e0842615cf75e007231))
- correct semantic node version ([#1452](https://github.com/consolelabs/mochi-discord/issues/1452)) ([1095429](https://github.com/consolelabs/mochi-discord/commit/10954291865f741d2f0b218ff395486be7ef45a8))
- update semantic release deps ([#1451](https://github.com/consolelabs/mochi-discord/issues/1451)) ([9dacd5a](https://github.com/consolelabs/mochi-discord/commit/9dacd5a295d738d8781935934b0ccb349cc90e14))

### Features

- add CI notify changelog ([#1450](https://github.com/consolelabs/mochi-discord/issues/1450)) ([07cb9e8](https://github.com/consolelabs/mochi-discord/commit/07cb9e85852e58ee5f1aa491ec193988f6b0575d))

# [6.27.0-rc.1](https://github.com/consolelabs/mochi-discord/compare/v6.26.6...v6.27.0-rc.1) (2023-08-18)

### Bug Fixes

- convert ratio ([#1442](https://github.com/consolelabs/mochi-discord/issues/1442)) ([e2fb70b](https://github.com/consolelabs/mochi-discord/commit/e2fb70b477af4b5b86210e0842615cf75e007231))
- correct semantic node version ([#1452](https://github.com/consolelabs/mochi-discord/issues/1452)) ([1095429](https://github.com/consolelabs/mochi-discord/commit/10954291865f741d2f0b218ff395486be7ef45a8))
- update semantic release deps ([#1451](https://github.com/consolelabs/mochi-discord/issues/1451)) ([9dacd5a](https://github.com/consolelabs/mochi-discord/commit/9dacd5a295d738d8781935934b0ccb349cc90e14))

### Features

- add CI notify changelog ([#1450](https://github.com/consolelabs/mochi-discord/issues/1450)) ([07cb9e8](https://github.com/consolelabs/mochi-discord/commit/07cb9e85852e58ee5f1aa491ec193988f6b0575d))
