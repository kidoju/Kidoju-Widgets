# Vendor file updates

## CodeMirror

1. Download archive from https://github.com/codemirror/CodeMirror and copy required files
2. run npm install && npm build
3. Get [jshint.js](https://raw.githubusercontent.com/jshint/jshint/master/dist/jshint.js) from https://github.com/jshint/jshint

## HighlighJS

1. Download and unzip/untar the [latest release](https://github.com/isagalaev/highlight.js/releases) into a directory
2. Go to this directory and run ```npm install```
3. Run ```node tools/build.js :common``` or any other command [described here](http://highlightjs.readthedocs.org/en/latest/building-testing.html)
4. Copy highlight.pack.js and css files to your project

## Kendo UI

> Attention! Kidoju Widgets use open source Kendo UI Core, not commercial Kendo UI

1. Get Kendo UI Core from https://github.com/telerik/kendo-ui-core
2. Get minimized versions from http://cdn.kendostatic.com/<version>/js/kendo.all.min.js, respectively http://cdn.kendostatic.com/<version>/styles/kendo.common.min.css

Required files can be found at http://www.telerik.com/download/custom-download

## KaTeX and MathQuill

Building KaTeX and Mathquill requires ```make``` which is not available on Windows.

On Windows 10, we now have **Bash on Unbuntu on Windows**.
 
Requirements can be installed (only once):

1. [Install Bash on Unbuntu on Windows](https://msdn.microsoft.com/en-gb/commandline/wsl/install_guide).
2. Open Bash on Unbuntu on Windows, and if you get ```unable to resolve host (machine name)```, add your machine to ```/etc/hosts``` as explained here](http://askubuntu.com/questions/59458/error-message-when-i-run-sudo-unable-to-resolve-host-none).
3. Run ```sudo apt-get -y update```.
4. Run ```sudo apt-get -y autoremove```.
5. Run ```sudo apt-get install -y build-essential```
6. Run ```curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -``` (see [nodeJS install instructions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions))
7. Run ```sudo apt-get install -y nodejs```

Then each time you need to build KaTeX

1. Go to your katex directory, e.g. ```cd /mnt/c/WebStorm/vendors/katex```
2. Run ```make dist```.

And each time you need to build MathQuill

1. Go to your mathquill directory, e.g. ```cd /mnt/c/WebStorm/vendors/mathquill```
2. Run ```make```.

## SilentMatt's Expr-Eval

The source code is available at https://github.com/silentmatt/expr-eval, but this is for nodejs.
The browser version can be downloaded from https://cdnjs.cloudflare.com/ajax/libs/expr-eval/1.0.0/bundle(.min).js.
