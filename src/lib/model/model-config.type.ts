type TextConfigValue = {
  label: string;
  name: string;
  description?: string;
  type: "text";
  value?: string;
};

type NumberConfigValue = {
  label: string;
  name: string;
  description?: string;
  type: "number";
  value?: string;
  min: number;
  max: number;
};

type EnumConfigValue = {
  label: string;
  description?: string;
  name: string;
  type: "enum";
  value?: string;
  options: string[];
};

export type ConfigValue = TextConfigValue | NumberConfigValue | EnumConfigValue;

export type ModelConfig = ConfigValue[];
