/* tslint:disable */
/* eslint-disable */
/**
 * CrmModuls API — OpenAPI Generator uyumlu client
 */

import type { Configuration } from "./configuration";
import type { AxiosPromise, AxiosInstance, RawAxiosRequestConfig } from "axios";
import {
  DUMMY_BASE_URL,
  assertParamExists,
  setBearerAuthToObject,
  setSearchParams,
  serializeDataIfNeeded,
  toPathString,
  createRequestFunction,
} from "./common";
import type { RequestArgs } from "./base";
import { BaseAPI } from "./base";

export const OpportunityStage = {
  None: 0,
  New: 1,
  Contacted: 2,
  Qualified: 3,
  ProposalSent: 4,
  Negotiation: 5,
  Won: 6,
  Lost: 7,
  Cancelled: 8,
} as const;

export type OpportunityStage = (typeof OpportunityStage)[keyof typeof OpportunityStage];

export const LeadSource = {
  None: 0,
  ColdCall: 1,
  Website: 2,
  Referral: 3,
  Partner: 4,
  Event: 5,
  SAP: 6,
  Arete: 7,
  Other: 8,
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export interface CreateCrmModulDto {
  workCompanyId?: string | null;
  partnerCompanyName?: string | null;
  contactPerson?: string | null;
  contactTitle?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  leadSource?: LeadSource | null;
  accountManager?: string | null;
  solutionModule?: string | null;
  opportunityStage?: OpportunityStage;
  unitPrice?: number | null;
  personCount?: number | null;
  estimatedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  nextAction?: string | null;
  notes?: string | null;
}

export interface UpdateCrmModulDto {
  workCompanyId?: string | null;
  partnerCompanyName?: string | null;
  contactPerson?: string | null;
  contactTitle?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  leadSource?: LeadSource | null;
  accountManager?: string | null;
  solutionModule?: string | null;
  opportunityStage?: OpportunityStage;
  unitPrice?: number | null;
  personCount?: number | null;
  estimatedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  nextAction?: string | null;
  notes?: string | null;
}

export interface CrmModulDto {
  id?: string;
  workCompanyId?: string | null;
  partnerCompanyName?: string | null;
  contactPerson?: string | null;
  contactTitle?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  leadSource?: LeadSource | null;
  accountManager?: string | null;
  solutionModule?: string | null;
  opportunityStage?: OpportunityStage;
  unitPrice?: number | null;
  personCount?: number | null;
  estimatedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  createdDate?: string;
  updatedDate?: string | null;
  uniqNumber?: number;
}

export const CrmModulsApiAxiosParamCreator = function (configuration?: Configuration) {
  return {
    apiCrmModulsGet: async (options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmModuls`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      setSearchParams(localVarUrlObj, {});
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmModulsIdGet: async (id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulsIdGet", "id", id);
      const localVarPath = `/api/CrmModuls/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      setSearchParams(localVarUrlObj, {});
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmModulsPost: async (
      createCrmModulDto?: CreateCrmModulDto,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmModuls`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      const localVarQueryParameter = {} as Record<string, unknown>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      localVarHeaderParameter["Content-Type"] = "application/json";
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      localVarRequestOptions.data = serializeDataIfNeeded(
        createCrmModulDto,
        localVarRequestOptions,
        configuration
      );
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmModulsIdPut: async (
      id: string,
      updateCrmModulDto?: UpdateCrmModulDto,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulsIdPut", "id", id);
      const localVarPath = `/api/CrmModuls/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "PUT", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      const localVarQueryParameter = {} as Record<string, unknown>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      localVarHeaderParameter["Content-Type"] = "application/json";
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      localVarRequestOptions.data = serializeDataIfNeeded(
        updateCrmModulDto,
        localVarRequestOptions,
        configuration
      );
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmModulsIdDelete: async (id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulsIdDelete", "id", id);
      const localVarPath = `/api/CrmModuls/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "DELETE", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      setSearchParams(localVarUrlObj, {});
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
  };
};

export const CrmModulsApiFp = function (configuration?: Configuration) {
  const localVarAxiosParamCreator = CrmModulsApiAxiosParamCreator(configuration);
  return {
    async apiCrmModulsGet(
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<CrmModulDto>>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsGet(options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulsIdGet(
      id: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CrmModulDto>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsIdGet(id, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulsPost(
      createCrmModulDto?: CreateCrmModulDto,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsPost(createCrmModulDto, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulsIdPut(
      id: string,
      updateCrmModulDto?: UpdateCrmModulDto,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsIdPut(id, updateCrmModulDto, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulsIdDelete(
      id: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsIdDelete(id, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
  };
};

export class CrmModulsApi extends BaseAPI {
  public apiCrmModulsGet(options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsGet(options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulsIdGet(id: string, options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsIdGet(id, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulsPost(createCrmModulDto?: CreateCrmModulDto, options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsPost(createCrmModulDto, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulsIdPut(id: string, updateCrmModulDto?: UpdateCrmModulDto, options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsIdPut(id, updateCrmModulDto, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulsIdDelete(id: string, options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsIdDelete(id, options)
      .then((request) => request(this.axios, this.basePath));
  }
}
