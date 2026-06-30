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

export interface EnumOptionDto {
  key?: number;
  description?: string | null;
}

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
  Other: 7,
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const CrmCurrencyType = {
  None: 0,
  TRY: 1,
  USD: 2,
  EUR: 3,
} as const;

export type CrmCurrencyType = (typeof CrmCurrencyType)[keyof typeof CrmCurrencyType];

export const TypeCodes = {
  None: 0,
  Lisance: 1,
  Consulting: 2,
  MSP: 3,
} as const;

export type TypeCodes = (typeof TypeCodes)[keyof typeof TypeCodes];

export interface CrmSubItemInputDto {
  id?: string | null;
  solutionModuleIds?: string[] | null;
  unitPrice?: number | null;
  personCount?: number | null;
  discount?: number | null;
  estimatedValue?: number | null;
  estimatedDiscountedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  currencyType?: CrmCurrencyType | null;
  typeCode?: TypeCodes | null;
  opportunityStage?: OpportunityStage;
}

export interface CrmSubItemDto {
  id?: string;
  crmModulId?: string;
  solutionModuleIds?: string[] | null;
  solutionModuleNames?: string[] | null;
  unitPrice?: number | null;
  personCount?: number | null;
  discount?: number | null;
  estimatedValue?: number | null;
  estimatedDiscountedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  currencyType?: CrmCurrencyType | null;
  typeCode?: TypeCodes | null;
  opportunityStage?: OpportunityStage;
  createdDate?: string;
  updatedDate?: string | null;
  uniqNumber?: number;
}

export interface CreateCrmModulDto {
  companyName?: string | null;
  partnerCompanyName?: string | null;
  contactPerson?: string | null;
  contactTitle?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  leadSource?: LeadSource | null;
  accountManager?: string | null;
  crmSubItems?: CrmSubItemInputDto[] | null;
}

export interface UpdateCrmModulDto {
  companyName?: string | null;
  partnerCompanyName?: string | null;
  contactPerson?: string | null;
  contactTitle?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  leadSource?: LeadSource | null;
  accountManager?: string | null;
  crmSubItems?: CrmSubItemInputDto[] | null;
}

export interface CrmModulDto {
  id?: string;
  companyName?: string | null;
  partnerCompanyName?: string | null;
  contactPerson?: string | null;
  contactTitle?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  leadSource?: LeadSource | null;
  accountManager?: string | null;
  crmSubItems?: CrmSubItemDto[] | null;
  solutionModuleIds?: string[] | null;
  solutionModuleNames?: string[] | null;
  unitPrice?: number | null;
  personCount?: number | null;
  discount?: number | null;
  estimatedValue?: number | null;
  estimatedDiscountedValue?: number | null;
  expectedCloseDate?: string | null;
  lastContactDate?: string | null;
  currencyType?: CrmCurrencyType | null;
  typeCode?: TypeCodes | null;
  createdDate?: string;
  updatedDate?: string | null;
  uniqNumber?: number;
}

export interface CrmAiRaporRequestDto {
  musteri_adi: string;
  firsatlar: {
    ad: string;
    asama?: string;
    butce?: string;
  }[];
  notlar: {
    tarih?: string;
    firsat?: string;
    not?: string;
  }[];
}

export interface CrmAiFirsatAnaliziDto {
  firsat?: string | null;
  ozet?: string | null;
  firsat_skoru?: number | null;
  gerekce?: string | null;
  son_not_tarihi?: string | null;
  onerilen_cozum?: string | null;
  satis_aksiyonlari?: string[] | null;
  capraz_satis?: string[] | null;
  riskler?: string[] | null;
  rakip_durumu?: string | null;
  sonraki_adim?: string | null;
  oncelik_sirasi?: number | null;
}

export interface CrmAiRaporDataDto {
  musteri?: string | null;
  genel_ozet?: string | null;
  firsat_analizleri?: CrmAiFirsatAnaliziDto[] | null;
}

export interface CrmAiRaporApiResponseDto {
  message?: string;
  rapor?: CrmAiRaporDataDto;
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
    apiCrmModulsLeadSourcesGet: async (options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmModuls/LeadSources`;
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
    apiCrmModulsOpportunityStagesGet: async (
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmModuls/OpportunityStages`;
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
    apiCrmModulsCurrencyTypesGet: async (options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmModuls/CurrencyTypes`;
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
    apiCrmModulsTypeCodesGet: async (options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
      const localVarPath = `/api/CrmModuls/TypeCodes`;
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
    apiCrmModulsIdAiRaporPost: async (
      id: string,
      crmAiRaporRequestDto?: CrmAiRaporRequestDto,
      options: RawAxiosRequestConfig = {}
    ): Promise<RequestArgs> => {
      assertParamExists("apiCrmModulsIdAiRaporPost", "id", id);
      const localVarPath = `/api/CrmModuls/{id}/AiRapor`.replace(
        `{${"id"}}`,
        encodeURIComponent(String(id))
      );
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
        crmAiRaporRequestDto,
        localVarRequestOptions,
        configuration
      );
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
    async apiCrmModulsLeadSourcesGet(
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<EnumOptionDto>>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsLeadSourcesGet(options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulsOpportunityStagesGet(
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<EnumOptionDto>>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsOpportunityStagesGet(options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulsCurrencyTypesGet(
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<EnumOptionDto>>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsCurrencyTypesGet(options);
      return createRequestFunction(localVarAxiosArgs, configuration);
    },
    async apiCrmModulsTypeCodesGet(
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<EnumOptionDto>>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsTypeCodesGet(options);
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
    async apiCrmModulsIdAiRaporPost(
      id: string,
      crmAiRaporRequestDto?: CrmAiRaporRequestDto,
      options?: RawAxiosRequestConfig
    ): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CrmAiRaporApiResponseDto>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apiCrmModulsIdAiRaporPost(
        id,
        crmAiRaporRequestDto,
        options
      );
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

  public apiCrmModulsLeadSourcesGet(options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsLeadSourcesGet(options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulsOpportunityStagesGet(options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsOpportunityStagesGet(options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulsCurrencyTypesGet(options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsCurrencyTypesGet(options)
      .then((request) => request(this.axios, this.basePath));
  }

  public apiCrmModulsTypeCodesGet(options?: RawAxiosRequestConfig) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsTypeCodesGet(options)
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

  public apiCrmModulsIdAiRaporPost(
    id: string,
    crmAiRaporRequestDto?: CrmAiRaporRequestDto,
    options?: RawAxiosRequestConfig
  ) {
    return CrmModulsApiFp(this.configuration)
      .apiCrmModulsIdAiRaporPost(id, crmAiRaporRequestDto, options)
      .then((request) => request(this.axios, this.basePath));
  }
}
