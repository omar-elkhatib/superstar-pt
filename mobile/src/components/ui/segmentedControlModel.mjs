function slugifySegmentValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function buildSegmentedControlItems({ options = [], testIdPrefix, value } = {}) {
  return options.map((option, index) => {
    const optionValue = option?.value ?? option?.id ?? index;
    const isDisabled = Boolean(option?.disabled);
    const isSelected = optionValue === value;
    const optionSlug = slugifySegmentValue(optionValue);

    return {
      ...option,
      key: option?.key ?? String(optionValue),
      value: optionValue,
      label: option?.label ?? String(optionValue),
      isDisabled,
      isSelected,
      accessibilityState: {
        selected: isSelected,
        disabled: isDisabled
      },
      testID: option?.testID ?? (testIdPrefix ? `${testIdPrefix}-${optionSlug}` : undefined)
    };
  });
}
