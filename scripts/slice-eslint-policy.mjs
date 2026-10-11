import shadcn from '@shadcn/lint';
import parser from '@typescript-eslint/parser';
import ds from './design-jsx-policy.mjs';
// Pinned shadcn 0.2.0 contracts replace (not extend) allow. Tabs/Content
// are raw Radix aliases; only their layout/scale spacing is delegated here.
export const restyleContracts=[
 {pattern:'^(Tabs|TabsContent)$',allow:['layout','spacing']},
 // Row/Stack document gap as their layout input; padding/paint remain closed.
 {pattern:'^(Row|Stack)$',allow:['layout','gap-*']},
];
export const geometryClasses={
 'primitives/progress.tsx':['w-[var(--g-progress-width)]'],
 'components/bottom-sheet.tsx':['pb-[max(1rem,env(safe-area-inset-bottom))]'],
 'components/bottom-cta.tsx':['pb-[max(1rem,env(safe-area-inset-bottom))]'],
};
export const sliceFiles=['packages/core/src/ui/**/*.{ts,tsx}','apps/docs/src/**/*.{ts,tsx}'];
export const sliceImports=['^\\./hangyeol/(?:primitives|components|foundation)/','^\\.\\./(?:primitives|components)/','^@hangyeol/'];
const owners=['foundation/theme','primitives/button','primitives/badge','primitives/input','primitives/layout','primitives/select','primitives/tabs','primitives/dialog','components/text-field','components/composition','primitives/checkbox','primitives/switch','primitives/textarea','primitives/slider','primitives/progress','primitives/separator','primitives/skeleton','primitives/loading-spinner','primitives/container','primitives/grid','primitives/highlight','primitives/icon','primitives/icon-button','components/form-field','components/action-group','components/list-header','components/list-footer','components/empty-state','components/search-field','components/email-input','components/password-input','components/number-input','components/formatted-input','components/phone-input','components/currency-input','components/file-input','components/checkbox-group','components/rating','components/address-field','primitives/popover','primitives/tooltip','primitives/radio-group','components/segmented-control','components/icon-action','components/multi-select','components/combobox','components/table','components/pagination','components/alert','components/error-state','components/result','components/progress-stepper','components/breadcrumb','components/bubble','primitives/menu','primitives/accordion','primitives/collapse','primitives/confirm','components/drawer','components/bottom-sheet','components/list-row','components/grid-list','components/gnb','components/lnb','components/shell','components/bottom-cta','components/toast','components/date-picker','components/month-picker','components/time-input','components/date-time-input','components/date-range-picker','components/data-table','components/chart'];
export const sliceConfig=[
 {files:sliceFiles,languageOptions:{parser,parserOptions:{ecmaVersion:'latest',sourceType:'module',ecmaFeatures:{jsx:true}}},plugins:{shadcn,ds},settings:{shadcn:{componentImports:sliceImports,mergeFunctions:['cn']}},rules:{'shadcn/no-restyle':['error',{allow:['layout'],contracts:restyleContracts}],'ds/no-unowned-custom-properties':['error',{owners:[]}],'shadcn/no-raw-colors':'error','shadcn/no-arbitrary-values':'error','shadcn/no-inline-styles':['error',{allow:[]}],'shadcn/require-static-classes':'error'}},
 // Exact native-control/style composition owners. The four other rules remain enabled.
 {files:owners.flatMap(name=>[`packages/core/src/ui/${name}.tsx`,`apps/docs/src/hangyeol/${name}.tsx`]),rules:{'shadcn/no-restyle':'off'}},
 // Runtime geometry contracts are shared with packed-consumer policy; consumers
 // additionally require original records and actual canonical source/CSS bytes.
 ...Object.entries(geometryClasses).map(([file,allow])=>({files:[`packages/core/src/ui/${file}`,`apps/docs/src/hangyeol/${file}`],rules:{'shadcn/no-arbitrary-values':['error',{allow}]}})),
 // Runtime inputs only: exact authoring sites, never semantic token overrides.
 ...[
  ...['packages/core/src/ui/','apps/docs/src/hangyeol/'].flatMap(prefix=>[
   {file:prefix+'primitives/progress.tsx',properties:['--g-progress-width']},
   {file:prefix+'components/brand-mark.tsx',properties:['--hangyeol-brand-mask']},
  ]),
  {file:'apps/docs/src/brand-ci.tsx',properties:['--hangyeol-brand-width']},
  {file:'apps/docs/src/foundation-pages.tsx',properties:['--hangyeol-space-multiple','--hangyeol-swatch-color']},
  {file:'apps/docs/src/visitor-pages.tsx',properties:['--docs-preview-gap','--docs-preview-text-size']},
 ].map(owner=>({files:[owner.file],rules:{'ds/no-unowned-custom-properties':['error',{owners:[owner]}]}})),
];
