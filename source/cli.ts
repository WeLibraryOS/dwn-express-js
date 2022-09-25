import { KeyPair, makeDataCID, makeKeyPair, makeTestJWS, makeTestVerifiableCredential, TestMethodResolver, featureDetectionMessageBody } from "../tests/helpers";
import fetch from "cross-fetch";

let aliceKey: KeyPair;
let bobKey: KeyPair;

async function doStuff() {
  aliceKey = await makeKeyPair();
  bobKey = await makeKeyPair();
}

doStuff().then(result => {

  const body = featureDetectionMessageBody('did:test:alice');

    fetch('http://localhost:8080', { 
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      } }).then((result: any) => {
       result.json().then((result: any) => {
          console.log(JSON.stringify(result, null, 2));
       })
    }).catch((error: any) => {
        console.log(error);
    })
})