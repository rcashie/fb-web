# fb-web
The web server and client app for the framebastard website.
The server delivers static content and exposes REST apis for retrieving asset data.

* [Setup](#setup)
* [Building and Running](#building-and-running)
* [Documents](#documents)

## Setup

### Couchbase
framebastard uses [Couchbase](https://www.couchbase.com/) to store and query documents.

1. Install Couchbase or spin up an instance of a [Couchbase Docker container](https://hub.docker.com/_/couchbase). Make sure to use **Community Edition** version **6.5 or higher**.

2. To initialize your cluster run [setup.sh](couchbase/setup.sh) for a locally installed cluster:
    ```sh
    ./setup.sh --user <username> --password <password> --create-bkt-indices --create-fts-indices
    ```

    or [setup_docker.sh](couchbase/setup_docker.sh) for a cluster running in a Docker container:
    ```sh
    ./setup_docker.sh --container <container id/name> --user <username> --password <password> --create-bkt-indices --create-fts-indices
    ```

    See [setup.sh](couchbase/setup.sh) for a full list of parameters.

### Client
The front end of this application is built using web components via the [Polymer 3](https://polymer-library.polymer-project.org/3.0/docs/about_30) library.

1. Install npm and node. Using [nvm](https://github.com/creationix/nvm#installation) to handle this for you is recommended.

2. Install client dependencies locally. From the *client directory* run:
    ```sh
    npm install
    ```

### Server Setup
The backend of this app is written in [Rust](https://www.rust-lang.org).

1. [Install](https://www.rust-lang.org/en-US/install.html) Rust

2. Install the dependencies for building [libcouchbase](https://github.com/couchbase/libcouchbase).
Although libcouchbase supports `libev-dev`, the Rust library wrapper [does not](https://github.com/couchbaselabs/couchbase-rs/blob/991b6d602f63a4db6ee153ed0d1b7f69142c6a09/couchbase-sys/build.rs#L20).
    ```sh
    # For Debian-based distributions
    sudo apt install libssl-dev libevent-dev cmake llvm-dev libclang-dev clang
    ```

3. Copy `config.json.sample` to `config.json` in the *server directory* and update it as necessary

4. To enable Rust debugging with VSCode install the [CodeLLDB extension](https://github.com/vadimcn/vscode-lldb) and use the checked in launch [configuration](server/.vscode/launch.json).

## Building and Running
You can use the [fb.sh](fb.sh) shell script to perform your basic running and building tasks

```sh
./fb.sh run-server [--mode|-m release|debug]
```
Starts the web server. This will compile the server if required. Effectively runs 'cargo build'. Default mode is 'release'.

```sh
./fb.sh watch-client [--mode|-m release|debug]
```
Watches the source of client and triggers a client build when something changes. If the web server is running (run-server) just refresh the browser to see your changes. Effectively runs 'chokidar'. Default mode is 'release'.

```sh
./fb.sh build [--mode|-m release|debug] [--client|-c] [--server|-s]
```
Builds the specified targets; client, server or both. At least one must be specified.

### Importing data
Once the application is running you can import data by using the [fb-web-import](https://github.com/rcashie/fb-web-import) project.

## Documents
[Data Schema](docs/data-design.md)

[Rest API](docs/rest-api.md)
