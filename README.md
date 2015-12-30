![bounties received](https://www.bountysource.com/badge/team?team_id=59027&style=bounties_received)

excel-builder.js
================

*V2 coming soon*. Mostly backwards compatible, except for the removal of async sheet building, and the builder returns a promise which will resolve with the excel data, rather than just returning the data. This will open the door for putting async building back in at a later date when some better options have been explored.

A way to build excel files with javascript

Documentation at http://excelbuilderjs.com/. This includes a 'cookbook' and some 
API documentation. 

Building
--------

Install Grunt:

	npm install -g grunt-cli

Install dependencies:

	npm install

Combine & uglify:

	grunt requirejs

Distributables
---------------
excel-builder.compiled.js -> All files in the EB package + Underscore

excel-builder.dist.js -> All files in the EB package + Underscore, with no need for external AMD provider (Web worker will not function in this build).

Contributing
-------------

Originally this project was sort of sponsored by a previous company I worked for. Unfortunately now it has no backing, and my time is very limited while I work on side projects to help make ends meet. If you use bountysource or contribute via paypal (to stephen@liberty-irm.com) to open up bounties on issues, it is very, very likely that I will add features and fix issues sooner than later. 

Otherwise, if you have the ability to contribute yourself, please just do so as normal - I'll review and pull changes as they come in as quickly as I can. 
