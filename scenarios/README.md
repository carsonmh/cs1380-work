# scenarios

## Running

Use `npm test` to test all scenarios or `npm test $MILESTONE` to test a specific milestone.

```bash
npm test $MILESTONE # Example: npm test m1
```

## Scenario Format

Each scenario is a single test case.
The test case will usually include some preparation steps, ask you to either fill out
some code to make the `expect` calls pass, or write the `expect` calls themselves.

An example of a scenario to M1 is shown below:
```javascript
test('(5 pts) (scenario) 40 bytes object', () => {
/* 
    Come up with a JavaScript object, which when serialized, 
    will result in a string that is 40 bytes in size.
*/
    let object = null;
    // Make the object so that the serialized size is 40 bytes
    object = "abcdefghijkl";

    const serialized = util.serialize(object);
    expect(serialized.length).toBe(40);
});
```


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

