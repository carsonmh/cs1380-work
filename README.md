# distribution

This is the distribution library. When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

## Installation

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)
  * Student Tests (`*.student.test.js`) - inside `test/test-student`

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To import the library, be it in a JavaScript file or on the interactive console, run:

```js
let distribution = require("@brown-ds/distribution");
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
let s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
let n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
distribution.local.status.get('sid', console.log); // 8cf1b
```

You can also store and retrieve values from the local memory:

```js
distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // {name: 'nikos'}
distribution.local.mem.get('key', console.log); // {name: 'nikos'}
```

You can also spawn a new node:

```js
let node = { ip: '127.0.0.1', port: 8080 };
distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
distribution.all.status.get('sid', console.log); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
```

You can also send messages to other nodes:

```js
distribution.all.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // 8cf1c
```

# M0: Setup & Centralized Computing
> Add your contact information below and in `package.json`.

* name: Carson Harrell

* email: carson_harrell@brown.edu

* cslogin: charrell


## Summary

> Summarize your implementation, including the most challenging aspects; remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete M0 (`hours`), the total number of JavaScript lines you added, including tests (`jsloc`), the total number of shell lines you added, including for deployment and testing (`sloc`).


My implementation consists of 6 components addressing T1--8. The most challenging aspect was process because it was my first time writing in bash. It was also very finicky and error prone which made it more difficult.


## Correctness & Performance Characterization


> Describe how you characterized the correctness and performance of your implementation.


To characterize correctness, we developed 8 that test the following cases:
- getText: regular html file with head and body, find text
- getURLs: regular html file with href tags, find urls
- merge: go through 2 local files and merge them
- stem: basic words, find the stem of them
- process: basic paragraph, call the function on it. This paragraph contains a word that is a substring of the test dataset
- query: case with 1 word
- query: case with 2 words
- query: case with 3 words


*Performance*: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.


## Wild Guess

> How many lines of code do you think it will take to build the fully distributed, scalable version of your search engine? Add that number to the `"dloc"` portion of package.json, and justify your answer below.

I think it will be 1500. I don't think it will be that heavy but the tests will make up a large portion of the loc. I also think there will be more tests as time goes on which is why the number is so high.

# M1: Serialization / Deserialization


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M1 (`hours`) and the lines of code per task.


My implementation comprises 2 software components, totaling 250 lines of code. Key challenges included figuring out how to allow for special characters. What I ended up doing was using JSON.stringify on the actual string object and that fixed the issue because it was then taken over by the json module. Another issue I had was making the object serialization and deserialization work. In order to fix this, I played around with using recursion in order to go through each element and recursively serialize, then do the same with deserialization. 


## Correctness & Performance Characterization


> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote 10 tests; these tests take around 1 second to execute. This includes objects with special characters, functions, all different types, and objects that are deeply recursive.


*Performance*: The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.
# Results and Reflections

Note that the latency and throughput are formatted in this way:
1st value: serialization of complex object
2nd value: deserialization of complex object
3rd value: serialization of function
4th value: deserialization of function
5th value: serialization of basic value
6th value: deserialization of basic value

# M2: Actors and Remote Procedure Calls (RPC)


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M2 (`hours`) and the lines of code per task.


My implementation comprises `<number>` software components, totaling `<number>` lines of code. Key challenges included `<1, 2, 3 + how you solved them>`.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote `<number>` tests; these tests take `<time>` to execute.


*Performance*: I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop. Average throughput and latency is recorded in `package.json`.


## Key Feature

> How would you explain the implementation of `createRPC` to someone who has no background in computer science — i.e., with the minimum jargon possible?

I would say that it is a computation that one computer tells another computer to do. Then other computer then sends back the result. 

# M3: Node Groups & Gossip Protocols


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M3 (`hours`) and the lines of code per task.


My implementation comprises 6 new software components, totaling 300 added lines of code over the previous implementation. Key challenges included first building out the logic for routes. There were a lot of particulars to be considered with the inputs and errors to be handled so it was a challenge debugging that. Another key challenge was that I had some trouble with the groups put method. I wasn't sure where I was supposed to store the different groups. I ended up splitting it up into distribution methods and local group hashmap. 


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

I ran tests and looked through the code to ensure correctness

*Correctness* -- number of tests and time they take.
5 tests - around 30 milliseconds

*Performance* -- spawn times (all students) and gossip (lab/ec-only).
average of 27ms per spawn call

## Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

Because this would lead to scalability issues. There would be way too many operations happening at a large # of nodes so this wouldn't be sustainable. 

# M4: Distributed Storage


## Summary

> Summarize your implementation, including key challenges you encountered
My implementation does mem and store for the distributed system. One challenge I encountered was that there were issues setting up the store, as I wasn't sure how to associate different files with groups. I ended up adding the group in the name of the file and this fixed the issue. There weren't any other issues with my implementation. 

Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M4 (`hours`) and the lines of code per task.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness* -- number of tests and time they take.
5 tests, they take around 10 ms to complete


*Performance* -- insertion and retrieval.
Performance is found in the package.json. 

## Key Feature

> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?

Because fetching all objects and then pushing them to the corresponding location would require a significant time sink and isn't required for what reconf is trying to do. Also, not all of them need to be pushed, so this would be a waste. 


# M5: Distributed Execution Engine


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M5 (`hours`) and the lines of code per task.


My implementation comprises 1 new software components, totaling 350 added lines of code over the previous implementation. 

Key challenges included One key challenge was the setup. It was very difficult to figure out how to manage everything, and figure out how to make the nodes communicate with each other. Turns out you can just use the notify function to have each node send updates to each other and this works perfectly fine. Another challenge I ran into was getting the distributed shuffle to work. In the case where different nodes are sending the same key to one node, this caused things to get overwritten. So I just had each node create a unique key for the data and the node just put each item into memory, and then could read it that way as well. Finally, another challenge was allowing updates from all the nodes to the coordinator node. Turned out I was able to use an interval function to wait for the case where the nodes have all updated and this worked fine. 

My implementation includes having a notify function, shuffle, map and reduce function on each of the nodes. This in turn allows everyone to communicate and allows each node to perform their respective tasks. Then the coordinator node basically does everything, and sends updates to the nodes for each operation and then subsequently waits for them to complete their tasks by waiting for an update from each one. 


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote 5 cases testing the end-to-end functionality. This tests the exec function, notify function, and analyzes the different cases including complex reduce logic, list return values, map return values and different types of input data.


*Performance*: My Computer can sustain 700 data points/second, with an average latency of 1.4 milliseconds seconds per data point


## Key Feature

> Which extra features did you implement and how?
I didn't implement any of the extra features. 