import { Region } from "./lib/types";
import { generateRandomString } from "./lib/utils";

const API_URL = "https://gateway.zeabur.com/graphql";

export default class ZeaburClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Create a Project
  private async createProject(
    projectRegion: keyof typeof Region
  ): Promise<string> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `mutation CreateProject($region: String!) {
                createProject(region: $region) {
                    _id
                }
            }`,
          variables: { region: projectRegion },
        }),
      });

      const { data } = await res.json();

      return data.createProject._id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Create a Service
  private async createService(
    projectID: string,
    serviceName: string
  ): Promise<string> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `mutation CreateService($projectID: ObjectID!, $template: ServiceTemplate!, $name: String!) {
                createService(projectID: $projectID, template: $template, name: $name) {
                    _id
                }
            }`,
          variables: {
            projectID,
            template: "GIT",
            name: serviceName,
          },
        }),
      });

      const { data } = await res.json();

      return data.createService._id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Get Environment ID
  private async getEnvironment(projectID: string): Promise<string> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `query GetEnvironment($projectID: ObjectID!) {
                environments(projectID: $projectID) {
                    _id
                }
            }`,
          variables: {
            projectID,
          },
        }),
      });

      const { data } = await res.json();

      return data.environments[0]._id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Create a Domain
  private async createDomain(
    serviceID: string,
    environmentID: string,
    serviceName: string,
    domainName?: string
  ): Promise<string> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `mutation CreateDomain($serviceID: ObjectID!, $environmentID: ObjectID!, $domain: String!, $isGenerated: Boolean!) {
                addDomain(serviceID: $serviceID, environmentID: $environmentID, domain: $domain, isGenerated: $isGenerated) {
                    domain
                }
            }`,
          variables: {
            serviceID,
            environmentID,
            domain: domainName ?? `${serviceName + generateRandomString()}`,
            isGenerated: true,
          },
        }),
      });

      const { data } = await res.json();
      return data.addDomain.domain;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Deploy Codes to Zeabur and Get a Domain
  public async deploy(
    code: Blob,
    projectRegion: keyof typeof Region,
    serviceName: string,
    domainName?: string
  ): Promise<string> {
    try {
      if (!code) throw new Error("Code is required");

      const projectID = await this.createProject(projectRegion);
      const environmentID = await this.getEnvironment(projectID);
      const serviceID = await this.createService(projectID, serviceName);

      const formData = new FormData();
      formData.append("environment", environmentID);
      formData.append("code", code, "code.zip");

      await fetch(
        `https://gateway.zeabur.com/projects/${projectID}/services/${serviceID}/deploy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: formData,
        }
      );

      const domain = await this.createDomain(
        serviceID,
        environmentID,
        serviceName,
        domainName
      );

      return domain;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
