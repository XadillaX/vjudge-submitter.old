# VIRTUAL JUDGE SUBMITTER

Welcome to this ***open-source project*** vjudge-submitter!

## WHAT'S IT?

`vjudge-submitter` is short for ***Virtual Judge Submitter***.

### VIRTUAL JUDGE

Virtual Judge is something like the Polymerization of [Online Judge](http://en.wikipedia.org/wiki/Online_judge).

The Virtual Judge will contain several Online Judge's problems and when you submit code to one problem, the backend of Virtual Judge will submit your code to the origin Online Judge and fetch the submission record status and return.

### VIRTUAL JUDGE SUBMITTER

This project is mainly for the people who is going to develop him/her self Virtual Judge.

It gives you the unified API functions of each different Online Judges.

The APIs including `login`, `submit`, and `fetch result`. If you have some better ideas, maybe it will contain an API based on your idea!

You contribute to `vjudge-submitter` and of cause `vjudge-submitter` will help you to easy build a Virtual Judge core!

### ANOTHER IMPORTANT PROJECT OF VJLIB

It's a virtual judge spider. Coded by `NODE.JS` either. It's to fetch the content of each problem in different Online Judge Systems.

You can view and fork the project at https://github.com/XadillaX/vjudge-description-spider.

## HOW TO BUILD UP THE TEST PROJECCT?

You should make a new directory:

```bash
$ mkdir vjproject
$ cd vjproject
```

And then make the `node_modules` folder:

```bash
$ mkdir node_modules
$ cd node_modules
```

Clone the repo:

```bash
$ git clone git@github.com:XadillaX/vjudge-submitter.git
```

You will see a new repo directory vjudge-submitter. You should rename it:

```bash
$ mv vjudge-submitter nbut-vj-core
```

Then copy the test files to the project root directory:

```bash
$ cd vjudge-submitter
$ cp test* ../../
$ cd ../../
```

Finally you can run the command below to test this project:

```bash
$ node test.js
```

## GUIDE NAVIGATION LINKS

In this wiki, we will introduce three things:

+ [How to contribute a new OJ Submitter?](https://github.com/XadillaX/vjudge-submitter/wiki/How-to-contribute-a-new-OJ-Submitter%3F)
+ [How to use vjudge-submitter?](https://github.com/XadillaX/vjudge-submitter/wiki/How-to-use-vjudge-submitter%3F)
+ [How to build up the test project?](https://github.com/XadillaX/vjudge-submitter/wiki/How-to-build-up-the-tester-project%3F)

## CONTACT

If you want contribute to this project, you can fork it!

And if you have some question, you can post it to [ISSUES](issues) or contact me:

> + Email: admin#xcoder.in
> + Website: http://xcoder.in
