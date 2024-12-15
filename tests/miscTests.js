import { utils } from '../js/pdf.js';

function assertTrue(given, expected) {
  if (expected != given) {
    console.error("====[Test Failed!\n\tgiven\t\t["+given+"]\n\texpected\t["+expected+"]")
   throw new Error("Something went badly wrong!");

  }
}

function assertTrueS(given, expected) {
  if (expected + "" != given + "") {
    console.error("====[Test Failed!\n\tgiven\t\t["+given+"]\n\texpected\t["+expected+"]")
    throw new Error("Something went badly wrong!");

  }
}


function buildPageListTests() {
  assertTrueS(utils._buildPageList("1,2", 6), [1,2])
  assertTrueS(utils._buildPageList("1-3", 10), [1,2,3])
  assertTrueS(utils._buildPageList("1-3,7-9", 10), [1,2,3,7,8,9])
  assertTrueS(utils._buildPageList("", 3), [1,2,3])
  let listOf100 = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]
  assertTrueS(utils._buildPageList("all", 100), listOf100)
  assertTrueS(utils._buildPageList(undefined, 100), listOf100)
  assertTrueS(utils._buildPageList("1-100", 100), listOf100)
  assertTrueS(utils._buildPageList("1-50,51-100", 100), listOf100)
  assertTrueS(utils._buildPageList("1,2-50,51,52-99,100", 100), listOf100)
  assertTrueS(utils._buildPageList("1,100", 100), [1,100])
  assertTrueS(utils._buildPageList("1,1,b,2", 100), [1,1,-1,2])
  assertTrueS(utils._buildPageList("-1,-6,0,1,2,b,3-10,6-11", 100), [1,2,-1,3,4,5,6,7,8,9,10,6,7,8,9,10,11])
  assertTrueS(utils._buildPageList("6,3-5,b,0-10,b,b,b,b,9-4", 100), [6,3,4,5,-1,1,2,3,4,5,6,7,8,9,10,-1,-1,-1,-1,9,8,7,6,5,4])
  assertTrueS(utils._buildPageList("asdfdsfad4", 100), undefined)
  assertTrueS(utils._buildPageList("4,5,6,aowfla,-e", 100), undefined)

}

export function tests() {
  assertTrue("a", "a")
  buildPageListTests()
}
