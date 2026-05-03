// Single-source registry of trust-related i18n keys. Components import from here
// instead of hard-coding string keys, so a single rename propagates everywhere
// and we can lint that every screen uses approved trust copy.

export const trustCopy = {
  moneyInYourName: 'trust.moneyInYourName',
  encrypted: 'trust.encrypted',
  stopAnytime: 'trust.stopAnytime',
  noHiddenCharges: 'trust.noHiddenCharges',
  consentBased: 'trust.consentBased',
  weDontHold: 'trust.weDontHold',
  dataNotSold: 'trust.dataNotSold',
  afterActionInvested: 'trust.afterActionInvested',
  investingFooter: 'trust.investingFooter',
  whyWeAsk: 'trust.whyWeAsk',
  securitySeal: 'trust.securitySeal',
} as const;

export type TrustCopyKey = keyof typeof trustCopy;
