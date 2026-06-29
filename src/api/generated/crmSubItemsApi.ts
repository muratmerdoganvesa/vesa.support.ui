/* tslint:disable */
/* eslint-disable */
/**
 * CrmSubItems API — OpenAPI Generator uyumlu client
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
import type { CrmSubItemDto } from "./crmModulsApi";
import type { CrmCurrencyType, TypeCodes } from "./crmModulsApi";

export interface CreateCrmSubItemDto {
  crmModulId: string;
  solutionModuleIds?: string[] | null;
  unitPrice?: number | null;
  personCount?: number | null;
  estimatedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  currencyType?: CrmCurrencyType | null;
  typeCode?: TypeCodes | null;
}

export interface UpdateCrmSubItemDto {
  solutionModuleIds?: string[] | null;
  unitPrice?: number | null;
  personCount?: number | null;
  estimatedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  currencyType?: CrmCurrencyType | null;
  typeCode?: TypeCodes | null;
}

export const CrmSubItemsApiAxiosParamCreator = function (configuration?: Configuration) {
  return {
    apiCrmSubItemsByCrmModulCrmModulIdGet: async (
      crmModulId: string,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      assertParamExists("apiCrmSubItemsByCrmModulCrmModulIdGet", "crmModulId", crmModulId);
      const localVarPath = `/api/CrmSubItems/ByCrmModul/{crmModulId}`.replace(
        `{${"crmModulId"}}`,
        encodeURIComponent(String(crmModulId))
      );
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
    apiCrmSubItemsIdGet: async (id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      assertParamExists("apiCrmSubItemsIdGet", "id", id);
      const localVarPath = `/api/CrmSubItems/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
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
    apiCrmSubItemsPost: async (
      createCrmSubItemDto?: CreateCrmSubItemDto,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmSubItems`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      localVarHeaderParameter["Content-Type"] = "application/json";
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      localVarRequestOptions.data = serializeDataIfNeeded(
        createCrmSubItemDto,
        localVarRequestOptions,
        configuration
      );
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmSubItemsIdPut: async (
      id: string,
      updateCrmSubItemDto?: UpdateCrmSubItemDto,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      assertParamExists("apiCrmSubItemsIdPut", "id", id);
      const localVarPath = `/api/CrmSubItems/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "PUT", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      localVarHeaderParameter["Content-Type"] = "application/json";
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      localVarRequestOptions.data = serializeDataIfNeeded(
        updateCrmSubItemDto,
        localVarRequestOptions,
        configuration
      );
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmSubItemsIdDelete: async (id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      assertParamExists("apiCrmSubItemsIdDelete", "id", id);
      const localVarPath = `/api/CrmSubItems/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
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

export const CrmSubItemsApiFp = function (configuration?: Configuration) {
  const localVarAxiosParamCreator = CrmSubItemsApiAxiosParamCreator(configuration);
  return {
    async apiCrmSubItemsByCrmModulCrmModulIdGet(
      crmModulId: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<CrmSubItemDto>>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmSubItemsByCrmModulCrmModulIdGet(
        crmModulId,
        options
      );
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmSubItemsIdGet(
      id: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CrmSubItemDto>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmSubItemsIdGet(id, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmSubItemsPost(
      createCrmSubItemDto?: CreateCrmSubItemDto,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmSubItemsPost(createCrmSubItemDto, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmSubItemsIdPut(
      id: string,
      updateCrmSubItemDto?: UpdateCrmSubItemDto,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmSubItemsIdPut(
        id,
        updateCrmSubItemDto,
        options
      );
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmSubItemsIdDelete(
      id: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmSubItemsIdDelete(id, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
  };
};

export class CrmSubItemsApi extends BaseAPI {
  public apiCrmSubItemsByCrmModulCrmModulIdGet(crmModulId: string, options?: RawAxiosRequestConfig) {
    return CrmSubItemsApiFp(this.configuration)
      .apiCrmSubItemsByCrmModulCrmModulIdGet(crmModulId, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmSubItemsIdGet(id: string, options?: RawAxiosRequestConfig) {
    return CrmSubItemsApiFp(this.configuration)
      .apiCrmSubItemsIdGet(id, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmSubItemsPost(createCrmSubItemDto?: CreateCrmSubItemDto, options?: RawAxiosRequestConfig) {
    return CrmSubItemsApiFp(this.configuration)
      .apiCrmSubItemsPost(createCrmSubItemDto, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmSubItemsIdPut(id: string, updateCrmSubItemDto?: UpdateCrmSubItemDto, options?: RawAxiosRequestConfig) {
    return CrmSubItemsApiFp(this.configuration)
      .apiCrmSubItemsIdPut(id, updateCrmSubItemDto, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmSubItemsIdDelete(id: string, options?: RawAxiosRequestConfig) {
    return CrmSubItemsApiFp(this.configuration)
      .apiCrmSubItemsIdDelete(id, options)
      .then((request) => request(this.axios, this.basePath));
  }
}
