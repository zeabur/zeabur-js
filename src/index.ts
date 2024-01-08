import ZeaburClient from "./ZeaburClient";

export { default as ZeaburClient } from "./ZeaburClient";

export const createClient = (apiKey: string): ZeaburClient => {
  return new ZeaburClient(apiKey);
};
