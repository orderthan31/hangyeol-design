# 컴포넌트 카탈로그

[처음으로](../README.md) · [설치하기](installation.md) · [CLI](cli.md)

현재 [설치 레지스트리](../packages/core/registry/items.json)의 **84개 선택 설치 항목**을 분류별로 정리했습니다. 테마·복합 구성·문서 보조 요소도 포함하므로 독립 위젯 수와 같지 않습니다. 타입, 훅, 함수와 재export 이름도 별개의 위젯으로 세지 않습니다.

설치를 마친 프로젝트에서 **CLI 이름**으로 선택합니다. 하나의 항목이 여러 export를 제공할 수 있습니다.

```sh
./node_modules/.bin/hangyeol add dialog --dry-run
./node_modules/.bin/hangyeol add dialog
```

`add`는 필요한 하위 항목과 공통 보조 파일을 함께 설치합니다. 표의 의존성은 **직접 요구 항목과 직접 npm 의존성**이며, 실제 설치에는 그 하위 의존성도 포함됩니다. `—`는 직접 추가 요구가 없다는 뜻이지 React·공통 헬퍼가 불필요하다는 뜻이 아닙니다.

**export / API** 링크는 저장소의 실제 구현과 타입 선언을 가리킵니다. 애플리케이션에서는 링크된 패키지 원본이 아니라 설치된 `src/hangyeol` 아래 파일을 import하세요. 표의 값 export는 주 모듈 기준이며, 타입은 `type`으로 따로 표시합니다. 각 컴포넌트의 필수 props·ref 대상·이벤트 계약은 연결된 소스에서 확인할 수 있습니다.

[테마와 레이아웃](#foundation) · [기본 요소와 동작](#basics) · [입력과 선택](#forms) · [날짜와 시간](#dates) · [탐색과 콘텐츠 구성](#navigation) · [오버레이와 상태 표시](#feedback) · [표와 차트](#data) · [문서와 디자인 보조](#auxiliary)

<a id="foundation"></a>
## 테마와 레이아웃

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `theme` | [`useTheme`, `useThemeScope`, `Theme`](../packages/core/src/ui/foundation/theme.tsx)<br>type: `ThemeMode`, `ThemeValues` | 밝은·어두운 모드와 팔레트·의미 토큰의 적용 범위. 훅도 함께 제공. | — |
| `layout` | [`Stack`, `Row`, `List`, `ListItem`](../packages/core/src/ui/primitives/layout.tsx)<br>type: `ListProps` | 세로·가로 배치와 목록·목록 항목의 기본 구성. | — |
| `container` | [`Container`](../packages/core/src/ui/primitives/container.tsx)<br>type: `ContainerProps` | 본문 폭과 좌우 여백을 정리하는 컨테이너. | — |
| `grid` | [`Grid`](../packages/core/src/ui/primitives/grid.tsx)<br>type: `GridProps` | 반응형 열 배치와 간격을 지정하는 그리드. | — |
| `shell` | [`Shell`](../packages/core/src/ui/components/shell.tsx)<br>type: `ShellProps` | 헤더·사이드바·본문과 모바일 메뉴를 구성하는 앱 틀. | `container`, `drawer`, `button` |

<a id="basics"></a>
## 기본 요소와 동작

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `button` | [`Button`](../packages/core/src/ui/primitives/button.tsx)<br>type: `ButtonProps` | 기본 버튼과 로딩·비활성 상태. | — |
| `icon` | [`Icon`](../packages/core/src/ui/primitives/icon.tsx)<br>type: `IconName`, `IconProps` | 선정된 Lucide 아이콘을 이름으로 사용. 전체 Lucide 이름 목록을 받는 API는 아님. | `lucide-react@1.52.0` |
| `icon-button` | [`IconButton`](../packages/core/src/ui/primitives/icon-button.tsx)<br>type: `IconButtonProps` | 접근 가능한 이름을 지정하는 아이콘 버튼. | `button`, `icon` |
| `icon-action` | [`IconAction`](../packages/core/src/ui/components/icon-action.tsx)<br>type: `IconActionProps` | 아이콘 버튼에 툴팁과 선택적 표시 레이블을 조합. | `icon-button`, `tooltip` |
| `badge` | [`Badge`](../packages/core/src/ui/primitives/badge.tsx)<br>type: `BadgeProps` | 텍스트 옆에 표시하는 상태·분류 배지. | — |
| `separator` | [`Separator`](../packages/core/src/ui/primitives/separator.tsx)<br>type: `SeparatorProps` | 콘텐츠 사이 구분선. | — |
| `highlight` | [`Highlight`](../packages/core/src/ui/primitives/highlight.tsx)<br>type: `HighlightProps` | 문자열 안에서 검색어와 일치하는 부분 강조. | — |
| `link` | [`Link`, `NavigationLink`, `SkipLink`, `NavigationGroupLabel`, `LinkFocusScope`](../packages/core/src/ui/primitives/link.tsx) | 본문·탐색·건너뛰기 링크, 탐색 제목과 링크 포커스 범위. | `@radix-ui/react-slot@1.4.0` |

<a id="forms"></a>
## 입력과 선택

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `input` | [`Input`](../packages/core/src/ui/primitives/input.tsx)<br>type: `InputProps` | 기본 HTML 입력과 오류·로딩 상태 표현. | — |
| `textarea` | [`Textarea`](../packages/core/src/ui/primitives/textarea.tsx)<br>type: `TextareaProps` | 여러 줄 텍스트 입력. | — |
| `text-field` | [`TextField`](../packages/core/src/ui/components/text-field.tsx)<br>type: `TextFieldProps` | 레이블·도움말·오류·지우기 동작을 조합한 입력. | `input`, `button`, `form-field` |
| `form-field` | [`FormField`](../packages/core/src/ui/components/form-field.tsx)<br>type: `FormFieldProps` | 레이블과 설명·오류를 입력 요소에 연결하는 필드 틀. | `input` |
| `control-label` | [`ControlLabel`, `ControlGroup`](../packages/core/src/ui/primitives/control-label.tsx) | 컨트롤 레이블과 조합 컨트롤의 포커스 표현. 배치는 호출자가 구성. | `@radix-ui/react-slot@1.4.0` |
| `search-field` | [`SearchField`](../packages/core/src/ui/components/search-field.tsx)<br>type: `SearchFieldProps` | 검색 입력과 검색 실행 콜백. | `text-field`, `icon` |
| `email-input` | [`EmailInput`](../packages/core/src/ui/components/email-input.tsx)<br>type: `EmailInputProps` | 이메일용 TextField. | `text-field` |
| `password-input` | [`PasswordInput`](../packages/core/src/ui/components/password-input.tsx)<br>type: `PasswordInputProps` | 표시·숨기기 전환을 가진 비밀번호 입력. | `input`, `form-field`, `icon-button` |
| `number-input` | [`NumberInput`](../packages/core/src/ui/components/number-input.tsx)<br>type: `NumberInputProps` | 숫자 입력과 증감 동작. | `input`, `form-field`, `icon-button` |
| `formatted-input` | [`FormattedInput`](../packages/core/src/ui/components/formatted-input.tsx)<br>type: `FormattedInputProps` | 정규화·표시 형식·검증 함수를 받는 입력. | `input`, `form-field` |
| `phone-input` | [`formatPhone`, `validatePhone`, `normalizePhone`, `PhoneInput`](../packages/core/src/ui/components/phone-input.tsx)<br>type: `PhoneInputProps` | 국내 전화번호 입력·형식화·검증. 국제번호는 지원하지 않음. | `formatted-input` |
| `currency-input` | [`formatCurrency`, `validateCurrency`, `normalizeCurrency`, `CurrencyInput`](../packages/core/src/ui/components/currency-input.tsx)<br>type: `CurrencyInputProps` | 금액 입력과 자릿수·범위 검증. 형식화 헬퍼도 제공. | `formatted-input` |
| `file-input` | [`FileInput`](../packages/core/src/ui/components/file-input.tsx)<br>type: `FileInputProps` | 파일 선택과 파일 목록·크기 검증. 업로드 서버는 별도 구현. | `input`, `form-field`, `button` |
| `address-field` | [`AddressField`](../packages/core/src/ui/components/address-field.tsx)<br>type: `AddressValue`, `AddressFieldProps` | 우편번호·주소·상세주소 입력. 주소 검색 서비스는 호출자가 연결. | `text-field`, `button` |
| `checkbox` | [`Checkbox`](../packages/core/src/ui/primitives/checkbox.tsx)<br>type: `CheckboxProps` | 체크 및 중간 상태를 표현하는 체크박스. | `@radix-ui/react-checkbox@1.3.12` |
| `checkbox-group` | [`CheckboxGroup`](../packages/core/src/ui/components/checkbox-group.tsx)<br>type: `CheckboxOption`, `CheckboxGroupProps` | 여러 옵션 선택과 선택적 전체 선택. | `checkbox` |
| `radio-group` | [`RadioGroup`](../packages/core/src/ui/primitives/radio-group.tsx)<br>type: `RadioOption`, `RadioGroupProps` | 레이블이 있는 단일 선택 옵션 그룹. | `@radix-ui/react-radio-group@1.4.8` |
| `switch` | [`Switch`](../packages/core/src/ui/primitives/switch.tsx)<br>type: `SwitchProps` | 켜짐·꺼짐 전환. | `@radix-ui/react-switch@1.3.8` |
| `slider` | [`Slider`](../packages/core/src/ui/primitives/slider.tsx)<br>type: `SliderProps` | 하나 이상의 thumb로 값을 조절하는 슬라이더. | `@radix-ui/react-slider@1.5.0` |
| `rating` | [`Rating`](../packages/core/src/ui/components/rating.tsx)<br>type: `RatingProps` | 정수 단위 점수 선택. | `icon` |
| `segmented-control` | [`SegmentedControl`](../packages/core/src/ui/components/segmented-control.tsx)<br>type: `SegmentOption`, `SegmentedControlProps` | 분할된 버튼 형태의 단일 선택. | `@radix-ui/react-toggle-group@1.1.20` |
| `select` | [`Select`](../packages/core/src/ui/primitives/select.tsx)<br>type: `SelectProps` | 옵션 배열을 받는 Radix 선택 UI. ref 대상은 select가 아니라 트리거 버튼. | `theme`, `icon`; `@radix-ui/react-select@2.3.8` |
| `native-select` | [`NativeSelect`](../packages/core/src/ui/primitives/native-select.tsx) | HTML select 요소. 옵션은 children으로 구성. | — |
| `color-input` | [`ColorInput`](../packages/core/src/ui/primitives/color-input.tsx) | HTML color 입력. | — |
| `combobox` | [`Combobox`](../packages/core/src/ui/components/combobox.tsx)<br>type: `ComboboxOption`, `ComboboxProps` | 검색어 입력과 옵션 선택을 결합한 필드. | `input`, `form-field`, `icon-button`, `popover` |
| `multi-select` | [`MultiSelect`](../packages/core/src/ui/components/multi-select.tsx)<br>type: `MultiSelectOption`, `MultiSelectProps` | 팝오버에서 여러 옵션을 선택하고 선택 항목을 표시. | `popover`, `checkbox`, `button`, `icon` |

<a id="dates"></a>
## 날짜와 시간

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `date-picker` | [`DatePicker`](../packages/core/src/ui/components/date-picker.tsx)<br>type: `DatePickerProps` | 문자열 날짜 입력과 달력 선택. | `text-field`, `button`, `popover`, `input`, `select` |
| `month-picker` | [`MonthPicker`](../packages/core/src/ui/components/month-picker.tsx)<br>type: `MonthPickerProps` | 문자열 월 입력과 월 선택. | `text-field`, `button`, `popover`, `input` |
| `time-input` | [`TimeInput`](../packages/core/src/ui/components/time-input.tsx)<br>type: `TimeInputProps` | 시간 입력과 시·분 선택. | `text-field`, `select` |
| `date-time-input` | [`DateTimeInput`](../packages/core/src/ui/components/date-time-input.tsx)<br>type: `DateTimeValue`, `DateTimeInputProps` | 날짜와 시간을 하나의 값으로 조합. | `date-picker`, `time-input`, `button` |
| `date-range-picker` | [`DateRangePicker`](../packages/core/src/ui/components/date-range-picker.tsx)<br>type: `DateRangeValue`, `DateRangePickerProps` | 시작·끝 날짜와 기간 선택. | `date-picker`, `button`, `popover` |

<a id="navigation"></a>
## 탐색과 콘텐츠 구성

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `tabs` | [`Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`](../packages/core/src/ui/primitives/tabs.tsx) | 탭 목록·트리거·콘텐츠 조합. Root와 Content는 Radix 직접 별칭. | `@radix-ui/react-tabs@1.1.22` |
| `breadcrumb` | [`Breadcrumb`](../packages/core/src/ui/components/breadcrumb.tsx)<br>type: `BreadcrumbItem`, `BreadcrumbProps` | 현재 위치와 상위 경로 표시. | `icon` |
| `gnb` | [`GNB`](../packages/core/src/ui/components/gnb.tsx)<br>type: `NavItem`, `GNBProps` | 로고·주 메뉴·액션을 배치하는 전역 탐색. | — |
| `lnb` | [`LNB`](../packages/core/src/ui/components/lnb.tsx)<br>type: `LNBItem`, `LNBProps` | 하위 항목을 가진 영역 탐색과 모바일 메뉴. | `drawer`, `button` |
| `accordion` | [`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`](../packages/core/src/ui/primitives/accordion.tsx) | 여러 접이식 항목과 트리거·콘텐츠 조합. | `icon`; `@radix-ui/react-accordion@1.2.21` |
| `collapse` | [`Collapse`, `CollapseTrigger`, `CollapseContent`](../packages/core/src/ui/primitives/collapse.tsx) | 단일 접이식 영역. Root는 Radix 직접 별칭. | `@radix-ui/react-collapsible@1.1.21` |
| `disclosure` | [`Disclosure`, `DisclosureSummary`](../packages/core/src/ui/primitives/disclosure.tsx) | HTML details·summary 기반 펼치기. | — |
| `menu` | [`Menu`, `MenuTrigger`, `MenuGroup`, `MenuLabel`, `MenuContent`, `MenuItem`, `MenuSeparator`](../packages/core/src/ui/primitives/menu.tsx) | 드롭다운 메뉴 조합. Root·Trigger·Group·Label은 Radix 직접 별칭. | `theme`; `@radix-ui/react-dropdown-menu@2.1.25` |
| `composition` | [`FormSection`, `ListPanel`](../packages/core/src/ui/components/composition.tsx)<br>type: `SectionProps`, `ListPanelProps` | 제목·설명·액션이 있는 폼 섹션과 목록 패널. | `layout`, `action-group`, `list-header`, `list-footer` |
| `action-group` | [`ActionGroup`](../packages/core/src/ui/components/action-group.tsx)<br>type: `ActionGroupProps` | 동작 버튼들의 정렬과 간격. | — |
| `list-header` | [`ListHeader`](../packages/core/src/ui/components/list-header.tsx)<br>type: `ListHeaderProps` | 목록 제목·설명·개수·액션. | `action-group` |
| `list-footer` | [`ListFooter`](../packages/core/src/ui/components/list-footer.tsx)<br>type: `ListFooterProps` | 목록 하단 설명과 액션. | `action-group` |
| `list-row` | [`ListRow`](../packages/core/src/ui/components/list-row.tsx)<br>type: `ListRowProps` | 제목·설명·선행 요소·액션이 있는 목록 행. | — |
| `grid-list` | [`GridList`](../packages/core/src/ui/components/grid-list.tsx)<br>type: `GridListProps` | 데이터와 렌더 함수를 받는 그리드형 목록. | — |
| `pagination` | [`Pagination`](../packages/core/src/ui/components/pagination.tsx)<br>type: `PaginationProps` | 페이지 번호와 이전·다음 이동. | `button`, `icon` |
| `bottom-cta` | [`BottomCTA`](../packages/core/src/ui/components/bottom-cta.tsx) | 화면 하단 동작 영역. 입력 중에는 고정 배치를 해제. | `action-group` |

<a id="feedback"></a>
## 오버레이와 상태 표시

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `dialog` | [`Dialog`, `DialogTrigger`, `DialogClose`, `DialogTitle`, `DialogDescription`, `DialogContent`](../packages/core/src/ui/primitives/dialog.tsx)<br>type: `DialogContentProps` | 모달 대화상자 조합. Root·Trigger·Close는 Radix 직접 별칭. | `theme`; `@radix-ui/react-dialog@1.2.0` |
| `confirm` | [`Confirm`](../packages/core/src/ui/primitives/confirm.tsx)<br>type: `ConfirmProps` | 확인·취소와 비동기 확인 동작을 가진 대화상자. | `button`, `theme`; `@radix-ui/react-alert-dialog@1.1.24` |
| `drawer` | [`Drawer`, `DrawerTrigger`, `DrawerClose`, `DrawerContent`](../packages/core/src/ui/components/drawer.tsx)<br>type: `DrawerContentProps` | 옆에서 열리는 대화상자. Root·Trigger·Close는 Dialog 재export. | `dialog`, `icon-button` |
| `bottom-sheet` | [`BottomSheet`, `BottomSheetTrigger`, `BottomSheetClose`, `BottomSheetContent`](../packages/core/src/ui/components/bottom-sheet.tsx)<br>type: `BottomSheetContentProps` | 하단 대화상자. Root·Trigger·Close는 Dialog 재export. | `dialog`, `icon-button` |
| `popover` | [`Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverClose`, `PopoverTitle`, `PopoverDescription`, `PopoverContent`](../packages/core/src/ui/primitives/popover.tsx)<br>type: `PopoverContentProps` | 트리거 옆 콘텐츠. Root·Trigger·Anchor·Close·Description은 Radix 직접 별칭. | `theme`; `@radix-ui/react-popover@1.2.0` |
| `tooltip` | [`Tooltip`, `TooltipProvider`, `TooltipRoot`, `TooltipTrigger`, `TooltipContent`](../packages/core/src/ui/primitives/tooltip.tsx)<br>type: `TooltipContentProps`, `TooltipProps` | 짧은 도움말. Provider·Root·Trigger는 Radix 직접 별칭. | `theme`; `@radix-ui/react-tooltip@1.3.0` |
| `toast` | [`ToastProvider`, `useToast`, `Toast`](../packages/core/src/ui/components/toast.tsx)<br>type: `ToastMessage` | 알림 표시와 Provider·알림 훅. | `button`, `icon-button`, `theme`; `@radix-ui/react-toast@1.2.24` |
| `alert` | [`Alert`](../packages/core/src/ui/components/alert.tsx)<br>type: `AlertTone`, `AlertProps` | 정보·성공·경고·오류 메시지와 액션. | `icon`, `icon-button` |
| `empty-state` | [`EmptyState`](../packages/core/src/ui/components/empty-state.tsx)<br>type: `EmptyStateProps` | 빈 화면의 제목·설명·삽화·액션. | — |
| `error-state` | [`ErrorState`](../packages/core/src/ui/components/error-state.tsx)<br>type: `ErrorStateProps` | 오류 메시지와 재시도 동작. | `alert`, `button` |
| `result` | [`Result`](../packages/core/src/ui/components/result.tsx)<br>type: `ResultProps` | 성공·오류·안내 결과 화면. | `empty-state`, `error-state`, `icon`, `button` |
| `progress` | [`Progress`](../packages/core/src/ui/primitives/progress.tsx)<br>type: `ProgressProps` | 진행률 표시. | `@radix-ui/react-progress@1.1.17` |
| `progress-stepper` | [`ProgressStepper`](../packages/core/src/ui/components/progress-stepper.tsx)<br>type: `ProgressStep`, `ProgressStepperProps` | 단계별 진행 상태와 선택적 단계 이동. | `icon` |
| `skeleton` | [`Skeleton`](../packages/core/src/ui/primitives/skeleton.tsx)<br>type: `SkeletonProps` | 콘텐츠 로딩 자리 표시. | — |
| `loading-spinner` | [`LoadingSpinner`](../packages/core/src/ui/primitives/loading-spinner.tsx)<br>type: `LoadingSpinnerProps` | 로딩 상태 표시. | — |
| `bubble` | [`Bubble`](../packages/core/src/ui/components/bubble.tsx)<br>type: `BubbleProps` | 작성자·시간·내용·액션이 있는 말풍선. | — |

<a id="data"></a>
## 표와 차트

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `table` | [`Table`, `TableCaption`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`](../packages/core/src/ui/components/table.tsx) | 표·캡션·머리·본문·바닥·행·셀의 기본 조합. | — |
| `data-table` | [`DataTable`](../packages/core/src/ui/components/data-table.tsx)<br>type: `DataTableColumn`, `DataTableProps` | 검색·필터·정렬·페이지·행 선택을 조합한 데이터 표. | `table`, `search-field`, `checkbox`, `select`, `button`, `pagination`, `empty-state`, `error-state` |
| `chart` | [`Chart`](../packages/core/src/ui/components/chart.tsx)<br>type: `ChartProps` | 선·막대·도넛 차트와 데이터 표. Recharts 3.10.1 및 react-is 19.2.0 추가 설치; 전체 Recharts API를 재export하지 않음. | `table`, `empty-state`, `error-state`; `recharts@3.10.1`, `react-is@19.2.0` |

<a id="auxiliary"></a>
## 문서와 디자인 보조

| CLI 이름 | export / API | 용도 | 직접 의존성 |
| --- | --- | --- | --- |
| `code-block` | [`CodeBlock`](../packages/core/src/ui/components/code-block.tsx) | 코드 형식화·구문 강조·복사. Prettier·Prism 및 Prism 타입 의존성 포함. | `button`; `prettier@3.6.2`, `prismjs@1.30.0`, `@types/prismjs@1.26.6` |
| `palette-picker` | [`PalettePicker`](../packages/core/src/ui/components/palette-picker.tsx)<br>type: `PaletteOption` | 팔레트 견본을 라디오 옵션으로 선택. | `theme`, `icon` |
| `brand-mark` | [`BrandMark`](../packages/core/src/ui/components/brand-mark.tsx) | 제공한 심볼·워드마크 URL을 표시. 브랜드 이미지 파일 자체를 제공하는 API는 아님. | `theme` |
| `preview-surface` | [`PreviewSurface`](../packages/core/src/ui/primitives/preview-surface.tsx) | 예제 미리보기의 표면 스타일. asChild로 기존 요소와 조합. | `@radix-ui/react-slot@1.4.0` |
| `specimen` | [`Specimen`](../packages/core/src/ui/primitives/specimen.tsx) | 토큰·간격·레이어 등의 정적 견본. 모달 동작을 추가하지 않음. | `@radix-ui/react-slot@1.4.0` |

## 조합·별칭과 보조 파일

- **직접 별칭과 재export:** Tabs·Dialog·Popover·Tooltip·Menu·Collapse 일부 export는 Radix 원본을 직접 참조합니다. Drawer·BottomSheet의 Root·Trigger·Close는 Dialog를 다시 내보냅니다. 이름이 다르다고 독립 구현이거나 모든 부분에 한결 스타일이 추가된 것은 아닙니다. 각 Content·Trigger 구성과 필수 레이블을 소스에 맞게 조합하세요.
- **날짜 선택 보조:** [CalendarGrid](../packages/core/src/ui/components/calendar-grid.tsx)와 [CalendarControls](../packages/core/src/ui/components/calendar-controls.tsx)는 DatePicker·DateRangePicker와 함께 설치됩니다. `calendar-grid`나 `calendar-controls`는 독립 `add` 이름이 아닙니다.
- **공통 헬퍼:** [useFieldState](../packages/core/src/ui/lib/use-field-state.ts), [날짜 유틸리티](../packages/core/src/ui/lib/date-utils.ts), [portal 헬퍼](../packages/core/src/ui/primitives/portal.tsx), [코드 형식화](../packages/core/src/ui/lib/code-format.ts)는 해당 항목의 설치 파일에 포함됩니다. `init`이 준비하는 [cn](../packages/core/src/ui/lib/cn.ts)도 로컬 소스입니다. 이 파일들은 카탈로그의 별도 선택 항목이 아닙니다.
- **CSS와 글꼴:** 일부 항목은 전용 CSS를 함께 가져옵니다. 생성된 파일 일부만 수동 복사하지 말고 의존 관계를 포함해 설치하세요. 테마·글꼴·진입 스타일 연결은 [설치 안내](installation.md)를 따릅니다.
- **Chart:** `chart`를 선택해야 Recharts 및 react-is 의존성이 추가됩니다. Chart는 정해진 데이터·series API를 가진 래퍼이며 모든 Recharts 구성 요소의 별칭 모음이 아닙니다.

설치 후 편집한 코드는 소비 프로젝트가 소유합니다. 소스 편집 시 native props, 포커스, 폼 동작과 접근 가능한 이름을 유지하고 앱에서 다시 검증하세요. 타입·빌드 통과만으로 모든 브라우저·보조공학 동작을 보장하지 않습니다.
