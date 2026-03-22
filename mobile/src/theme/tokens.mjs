const freeze = (value) => Object.freeze(value);

export const colorTokens = freeze({
  background: "#f4f7fb",
  surface: "#ffffff",
  surfaceMuted: "#eef3f8",
  surfaceAccent: "#e8f0ff",
  borderSubtle: "#d8e1ec",
  borderStrong: "#c3d0df",
  textPrimary: "#102235",
  textSecondary: "#516476",
  textMuted: "#7d8b98",
  accentPrimary: "#1f6fff",
  accentPrimaryPressed: "#1758cc",
  accentOnPrimary: "#ffffff",
  accentSoft: "#e6efff",
  accentSoftText: "#1d4ea8",
  successSoft: "#e8f5ed",
  warningSoft: "#fff3df",
  dangerSoft: "#fdeaea",
  segmentedTrack: "#e7edf4",
  shadow: "#102235"
});

export const spacingTokens = freeze({
  xxs: 6,
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 40,
  screenHorizontal: 20,
  screenVertical: 24
});

export const radiusTokens = freeze({
  sm: 14,
  md: 18,
  lg: 22,
  card: 24,
  pill: 999
});

export const typographyTokens = freeze({
  eyebrow: freeze({
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colorTokens.textMuted
  }),
  sectionTitle: freeze({
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colorTokens.textPrimary
  }),
  body: freeze({
    fontSize: 15,
    lineHeight: 22,
    color: colorTokens.textSecondary
  }),
  caption: freeze({
    fontSize: 13,
    lineHeight: 18,
    color: colorTokens.textMuted
  }),
  buttonLabel: freeze({
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700"
  }),
  heroValue: freeze({
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: colorTokens.textPrimary
  })
});

export const shadowTokens = freeze({
  card: freeze({
    shadowColor: colorTokens.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: freeze({ width: 0, height: 8 }),
    elevation: 4
  }),
  segment: freeze({
    shadowColor: colorTokens.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: freeze({ width: 0, height: 3 }),
    elevation: 2
  })
});

export const layoutTokens = freeze({
  screenMaxWidth: 720,
  sectionGap: spacingTokens.lg,
  cardGap: spacingTokens.sm
});

export const themeTokens = freeze({
  colors: colorTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  typography: typographyTokens,
  shadows: shadowTokens,
  layout: layoutTokens
});
