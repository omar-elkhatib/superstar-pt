import { adaptSession } from "./adaptivePlan.js";

const example = adaptSession({
  currentPain: 4,
  priorPain: 2,
  readiness: "medium",
  symptomWorsenedIn24h: false
});

console.log("Adaptive session decision:", example);

