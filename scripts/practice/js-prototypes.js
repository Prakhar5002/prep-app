/* Practice challenges — Prototypes & Inheritance */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'proto-chain-lookup',
    category: 'js-prototypes', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var animal = { eats: true };\nvar rabbit = Object.create(animal);\nrabbit.jumps = true;\n\nconsole.log(rabbit.eats, rabbit.jumps);\nconsole.log(rabbit.hasOwnProperty('eats'), rabbit.hasOwnProperty('jumps'));\nconsole.log(Object.getPrototypeOf(rabbit) === animal);\nconsole.log(rabbit.flies);",
    answer: "true true\nfalse true\ntrue\nundefined",
    explanation: "Object.create(animal) makes `animal` the new object's [[Prototype]] — rabbit has no own `eats` property, so reading rabbit.eats walks up the chain and finds it on animal. rabbit.jumps is an OWN property, found immediately without walking anywhere. hasOwnProperty only reports true for properties that live directly ON the object, not ones reached via the chain, which is why it's false for 'eats' but true for 'jumps'. Object.getPrototypeOf confirms the link, and rabbit.flies is undefined because the lookup walks the entire chain (rabbit → animal → Object.prototype) and never finds it anywhere."
  });

  reg({
    id: 'proto-create-null-no-tostring',
    category: 'js-prototypes', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var normalObj = {};\nvar nullProtoObj = Object.create(null);\nnullProtoObj.name = 'ghost';\n\nconsole.log(typeof normalObj.toString);\nconsole.log(typeof nullProtoObj.toString);\nconsole.log(Object.getPrototypeOf(nullProtoObj));\nconsole.log(nullProtoObj.name);\n\ntry {\n  console.log(nullProtoObj.toString());\n} catch (err) {\n  console.log(err instanceof TypeError, err.message);\n}",
    answer: "function\nundefined\nnull\nghost\ntrue nullProtoObj.toString is not a function",
    explanation: "Every plain `{}` literal implicitly has Object.prototype as its [[Prototype]], which is where the inherited toString method lives — that's why normalObj.toString is a function. Object.create(null) opts OUT of that entirely: the new object's [[Prototype]] is null, so there is nothing above it in the chain at all, and toString is simply not found anywhere — typeof nullProtoObj.toString is 'undefined'. Object.getPrototypeOf(nullProtoObj) confirms the chain terminates at null instead of Object.prototype. Own properties like `name` still work fine (they don't need a prototype). But calling nullProtoObj.toString() as a function throws a TypeError, because there is no such function to call — this is the classic reason 'bare' objects (often used as string-keyed maps) are created with Object.create(null): to avoid accidental collisions with inherited Object.prototype members."
  });

  reg({
    id: 'proto-hasownproperty-vs-in',
    category: 'js-prototypes', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function Vehicle(make) {\n  this.make = make;\n}\nVehicle.prototype.wheels = 4;\n\nvar car = new Vehicle('Toyota');\n\nconsole.log(car.hasOwnProperty('make'), car.hasOwnProperty('wheels'));\nconsole.log('make' in car, 'wheels' in car);\nconsole.log(Object.keys(car));\nconsole.log('toString' in car, car.hasOwnProperty('toString'));",
    answer: "true false\ntrue true\n[ 'make' ]\ntrue false",
    explanation: "hasOwnProperty only ever looks at the object's OWN properties, never the chain — 'make' was set directly via `this.make = make` inside the constructor (own), while 'wheels' lives on Vehicle.prototype (inherited), so hasOwnProperty reports true/false respectively. The `in` operator, by contrast, walks the ENTIRE prototype chain, so both 'make' and 'wheels' report true. Object.keys also only lists own enumerable properties, so it returns just ['make']. Finally, 'toString' in car is true because the chain goes car → Vehicle.prototype → Object.prototype, and toString lives on Object.prototype — but car.hasOwnProperty('toString') is false since it was never redefined directly on car."
  });

  reg({
    id: 'proto-instanceof-constructor',
    category: 'js-prototypes', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function Animal(name) { this.name = name; }\nfunction Dog(name) { Animal.call(this, name); }\nDog.prototype = Object.create(Animal.prototype);\nDog.prototype.constructor = Dog;\n\nvar rex = new Dog('Rex');\n\nconsole.log(rex instanceof Dog, rex instanceof Animal, rex instanceof Object);\nconsole.log(rex.constructor === Dog);\nconsole.log(rex.constructor.name);\nconsole.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype);",
    answer: "true true true\ntrue\nDog\ntrue",
    explanation: "instanceof works by walking rex's prototype chain and checking whether Dog.prototype (or Animal.prototype, or Object.prototype) appears anywhere in it — since Dog.prototype was built with Object.create(Animal.prototype), the chain is rex → Dog.prototype → Animal.prototype → Object.prototype, so all three checks succeed. The line `Dog.prototype.constructor = Dog` is necessary here: Object.create(Animal.prototype) produces a fresh object whose own 'constructor' link was lost (it would otherwise resolve up the chain to Animal), so without that explicit reassignment rex.constructor would incorrectly point to Animal instead of Dog. With it fixed, rex.constructor === Dog is true and rex.constructor.name is 'Dog'. Object.getPrototypeOf(Dog.prototype) confirms the manual link to Animal.prototype set up by Object.create."
  });

  reg({
    id: 'proto-mutate-shared-prototype-prop',
    category: 'js-prototypes', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function Config() {}\nConfig.prototype.version = 1;      // primitive default\nConfig.prototype.tags = ['default']; // shared reference default\n\nvar configA = new Config();\nvar configB = new Config();\n\nconfigA.version = 2;         // shadows: creates an OWN property on configA only\nconfigA.tags.push('extra');  // mutates the SHARED array in place\n\nconsole.log(configA.version, configB.version);\nconsole.log(configA.tags, configB.tags);\nconsole.log(configA.tags === configB.tags);\nconsole.log(Config.prototype.version);\nconsole.log(configA.hasOwnProperty('version'), configB.hasOwnProperty('version'));",
    answer: "2 1\n[ 'default', 'extra' ] [ 'default', 'extra' ]\ntrue\n1\ntrue false",
    explanation: "`configA.version = 2` is a plain ASSIGNMENT, not a mutation — it creates a brand-new OWN property on configA that shadows (hides) the inherited prototype value, leaving Config.prototype.version untouched at 1 and configB (which has no own 'version') still reading the original 1 from the chain. `configA.tags.push('extra')` is completely different: there is no assignment to `tags` at all, just a method call that mutates the array object IN PLACE — and since configA.tags and configB.tags are literally the SAME array object (inherited from the one shared Config.prototype.tags), the mutation is visible through every instance, proven by configA.tags === configB.tags being true. This is the core prototype gotcha: writing to `this.x` always creates a safe own property, but calling a mutating method on an inherited reference type changes shared state for everyone."
  });

  reg({
    id: 'proto-class-extends-super',
    category: 'js-prototypes', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "class Shape {\n  constructor(name) {\n    this.name = name;\n  }\n  describe() {\n    return `Shape: ${this.name}`;\n  }\n}\n\nclass Circle extends Shape {\n  constructor(name, radius) {\n    super(name);\n    this.radius = radius;\n  }\n  describe() {\n    return `${super.describe()}, radius ${this.radius}`;\n  }\n}\n\nvar c = new Circle('circle1', 5);\nconsole.log(c.describe());\nconsole.log(c instanceof Circle, c instanceof Shape);\nconsole.log(Object.getPrototypeOf(Circle) === Shape);\nconsole.log(Object.getPrototypeOf(Circle.prototype) === Shape.prototype);\nconsole.log(c.name, c.radius);",
    answer: "Shape: circle1, radius 5\ntrue true\ntrue\ntrue\ncircle1 5",
    explanation: "`class Circle extends Shape` wires up TWO prototype links at once: Circle.prototype's [[Prototype]] is set to Shape.prototype (so instances inherit instance methods), AND Circle itself (the constructor function) gets its own [[Prototype]] set to Shape (so static members would be inherited too) — both Object.getPrototypeOf checks confirm this. Inside Circle's constructor, `super(name)` must run before `this` can be used; it calls Shape's constructor with `this` already bound to the new Circle instance, setting this.name. Circle's own describe() calls `super.describe()`, which looks up describe() specifically on Shape.prototype (not on Circle.prototype, avoiding infinite recursion) and returns 'Shape: circle1'; the result is then interpolated with the radius. instanceof succeeds for both Circle and Shape because c's chain is c → Circle.prototype → Shape.prototype → Object.prototype."
  });

  reg({
    id: 'proto-spot-bug-shadowed-counter',
    category: 'js-prototypes', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'This is supposed to track a running total shared across every Counter instance — find the bug.',
    code: "function Counter() {}\nCounter.prototype.total = 0;\nCounter.prototype.increment = function () {\n  // BUG: `this.total + 1` reads the inherited prototype value fine, but the\n  // assignment `this.total = ...` ALWAYS creates a new OWN property on `this`,\n  // shadowing the prototype instead of updating one shared value.\n  this.total = this.total + 1;\n};\n\nvar counterA = new Counter();\nvar counterB = new Counter();\ncounterA.increment();\ncounterA.increment();\nconsole.log(counterA.total); // 2 — own property on counterA\nconsole.log(counterB.total); // expected 2 (shared), but logs 0 — untouched prototype\nconsole.log(Counter.prototype.total); // still 0 — the prototype was never mutated",
    answer: "function Counter() {}\nCounter.total = 0; // shared state lives on the constructor itself, not the prototype\nCounter.prototype.increment = function () {\n  Counter.total = Counter.total + 1;\n};",
    explanation: "Assigning to `this.total` can never mutate an inherited primitive — it only ever creates (or updates) an OWN property on that specific instance, shadowing the prototype's value from then on. So each call to increment() reads the current value (own if it already wrote one, otherwise the prototype's), adds 1, and writes it back as an OWN property — every instance ends up with its own independent counter, and Counter.prototype.total is frozen at its original default forever. To genuinely share state across every instance, the counter needs to live somewhere all instances read/write THROUGH, not something they each get their own copy of via shadowing — storing it directly on the constructor function (Counter.total) is a common pre-class-fields way to get that shared/static behavior."
  });

  reg({
    id: 'proto-spot-bug-shared-array-default',
    category: 'js-prototypes', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This factory is supposed to give every Team its own independent roster — find the bug.',
    code: "function Team(name) {\n  this.name = name;\n}\n// BUG: this array lives on the prototype, so ALL Team instances share the\n// exact same array object instead of each getting an independent roster.\nTeam.prototype.roster = [];\n\nvar teamA = new Team('Alpha');\nvar teamB = new Team('Beta');\n\nteamA.roster.push('Player1');\n\nconsole.log(teamA.roster); // ['Player1']\nconsole.log(teamB.roster); // expected [], but logs ['Player1'] — same shared array!\nconsole.log(teamA.roster === teamB.roster); // true — proves it's one shared object",
    answer: "function Team(name) {\n  this.name = name;\n  this.roster = []; // own array created fresh per instance, inside the constructor\n}",
    explanation: "A property assigned once with `Team.prototype.roster = []` creates exactly ONE array object that every instance inherits and shares through the prototype chain. Reading it looks harmless, but calling a mutating method like push() on it changes that single shared object in place — there's no assignment involved, so there's no shadowing to protect other instances, unlike primitive defaults on a prototype. That's why teamA.roster === teamB.roster is true: they were never two arrays to begin with. The fix moves the array literal into the constructor (`this.roster = []`), so every `new Team(...)` call allocates its own fresh, independent array instead of all instances pointing at the one prototype array."
  });
})();
