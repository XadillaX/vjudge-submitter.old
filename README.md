# nbut-vjudger-module

The Virtual Judge core module of NODE.JS.

## The Folder

### lib

#### util.js

Some usefule functions here.

#### node_modules

Some third-part modules.

#### oj

The default Online Judge Impl modules here. And all of them are inherited from base.js.

#### base.js

The base class of the core module.

#### test.cpp

A test code for NBUTOJ.

#### test.js

You can run it to test this core module.

## How To Build Up The Tester Project

You should make a new directory:

````bash
    mkdir vjproject
    cd vjproject
````bash

And then make the `node_modules` folder:

````bash
    mkdir node_modules
    cd node_modules
````bash

Clone the repo:

````bash
    git clone git@github.com:XadillaX/vjudge-submitter.git
````bash

You will see a new repo directory vjudge-submitter. You should rename it:

````bash
    mv vjudge-submitter nbut-vj-core
````bash

Then copy the test files to the project root directory:

````bash
    cd vjudge-submitter
    cp test* ../../
    cd ../../
````bash

Finally you can run the command below to test this project:

    node test.js