/* tslint:disable */
/* eslint-disable */
/**
 * CrmModulNotes API — OpenAPI Generator uyumlu client
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

export interface CrmModulNoteDto {
  id?: string;
  crmModulId?: string;
  nextAction?: string | null;
  notes?: string | null;
  createdDate?: string;
  updatedDate?: string | null;
  uniqNumber?: number;
}

export interface CreateCrmModulNoteDto {
  crmModulId: string;
  nextAction?: string | null;
  notes?: string | null;
}

export interface UpdateCrmModulNoteDto {
  nextAction?: string | null;
  notes?: string | null;
}

export const CrmModulNotesApiAxiosParamCreator = function (configuration?: Configuration) {
  return {
    apiCrmModulNotesByCrmModulCrmModulIdGet: async (
      crmModulId: string,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulNotesByCrmModulCrmModulIdGet", "crmModulId", crmModulId);
      const localVarPath = `/api/CrmModulNotes/ByCrmModul/{crmModulId}`.replace(
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
    apiCrmModulNotesIdGet: async (id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulNotesIdGet", "id", id);
      const localVarPath = `/api/CrmModulNotes/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
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
    apiCrmModulNotesPost: async (
      createCrmModulNoteDto?: CreateCrmModulNoteDto,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmModulNotes`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(createCrmModulNoteDto, localVarRequestOptions, configuration);
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmModulNotesIdPut: async (
      id: string,
      updateCrmModulNoteDto?: UpdateCrmModulNoteDto,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulNotesIdPut", "id", id);
      const localVarPath = `/api/CrmModulNotes/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      const baseOptions = configuration?.baseOptions;
      const localVarRequestOptions = { method: "PUT", ...baseOptions, ...options };
      const localVarHeaderParameter = {} as Record<string, string>;
      await setBearerAuthToObject(localVarHeaderParameter, configuration);
      localVarHeaderParameter["Content-Type"] = "application/json";
      setSearchParams(localVarUrlObj, {});
      const headersFromBaseOptions = baseOptions?.headers ?? {};
      localVarRequestOptions.headers = {
        ...localVarHeaderParameter,
        ...headersFromBaseOptions,
        ...options.headers,
      };
      localVarRequestOptions.data = serializeDataIfNeeded(updateCrmModulNoteDto, localVarRequestOptions, configuration);
      return { url: toPathString(localVarUrlObj), options: localVarRequestOptions };
    },
    apiCrmModulNotesIdDelete: async (id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulNotesIdDelete", "id", id);
      const localVarPath = `/api/CrmModulNotes/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(id)));
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

export const CrmModulNotesApiFp = function (configuration?: Configuration) {
  const localVarAxiosParamCreator = CrmModulNotesApiAxiosParamCreator(configuration);
  return {
    async apiCrmModulNotesByCrmModulCrmModulIdGet(
      crmModulId: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CrmModulNoteDto[]>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulNotesByCrmModulCrmModulIdGet(
        crmModulId,
        options
      );
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulNotesIdGet(
      id: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CrmModulNoteDto>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulNotesIdGet(id, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulNotesPost(
      createCrmModulNoteDto?: CreateCrmModulNoteDto,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulNotesPost(
        createCrmModulNoteDto,
        options
      );
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulNotesIdPut(
      id: string,
      updateCrmModulNoteDto?: UpdateCrmModulNoteDto,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulNotesIdPut(
        id,
        updateCrmModulNoteDto,
        options
      );
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulNotesIdDelete(
      id: string,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulNotesIdDelete(id, options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
  };
};

export class CrmModulNotesApi extends BaseAPI {
  public apiCrmModulNotesByCrmModulCrmModulIdGet(crmModulId: string, options?: RawAxiosRequestConfig) {
    return CrmModulNotesApiFp(this.configuration)
      .apiCrmModulNotesByCrmModulCrmModulIdGet(crmModulId, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulNotesIdGet(id: string, options?: RawAxiosRequestConfig) {
    return CrmModulNotesApiFp(this.configuration)
      .apiCrmModulNotesIdGet(id, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulNotesPost(createCrmModulNoteDto?: CreateCrmModulNoteDto, options?: RawAxiosRequestConfig) {
    return CrmModulNotesApiFp(this.configuration)
      .apiCrmModulNotesPost(createCrmModulNoteDto, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulNotesIdPut(
    id: string,
    updateCrmModulNoteDto?: UpdateCrmModulNoteDto,
    options?: RawAxiosRequestConfig
  ) {
    return CrmModulNotesApiFp(this.configuration)
      .apiCrmModulNotesIdPut(id, updateCrmModulNoteDto, options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulNotesIdDelete(id: string, options?: RawAxiosRequestConfig) {
    return CrmModulNotesApiFp(this.configuration)
      .apiCrmModulNotesIdDelete(id, options)
      .then((request) => request(this.axios, this.basePath));
  }
}
