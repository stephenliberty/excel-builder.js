![bounties received](https://www.bountysource.com/badge/team?team_id=59027&style=bounties_received)

excel-builder.js
================

A way to build excel files with javascript

Documentation at http://excelbuilderjs.com/. This is slightly outdated, but includes a 'cookbook' and some 
API documentation. New site coming soon with up-to-date documentation, and ability to contribute - see [https://github.com/stephenliberty/excel-builder-site](https://github.com/stephenliberty/excel-builder-site)

Installing via NPM
------------------

	npm install excel-builder


Building for web
----------------

Install Grunt:

	npm install -g grunt-cli

Install dependencies:

	npm install

Build & uglify:

	grunt

Distributables
---------------
excel-builder.compiled.js -> All files in the EB package and all dependencies.

excel-builder.dist.js -> All files in the EB package. Requires lodash and jszip scripts to be loaded on the page.

Contributing
-------------

Originally this project was sort of sponsored by a previous company I worked for. Unfortunately now it has no backing, and my time is very limited while I work on side projects to help make ends meet. If you use bountysource or contribute via paypal (to stephen@liberty-irm.com) to open up bounties on issues, it is very, very likely that I will add features and fix issues sooner than later. 

Otherwise, if you have the ability to contribute yourself, please just do so as normal - I'll review and pull changes as they come in as quickly as I can. 
