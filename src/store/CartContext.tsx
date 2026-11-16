import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { ADDON_IDS, BACKUPS_INCLUDED_PLAN_IDS } from '../config/addonsConfig';
import { SEEDED_CART_ITEMS } from '../config/catalog';
import {
  BillingCycle,
  CartItem,
  CatalogProduct,
  CheckoutStep,
  CompletedOrderReceipt,
  CurrencyCode,
  CustomerInfo,
  DomainConfig,
  DomainMode,
  OrderSummaryTotals,
  PaymentMethod,
  ProductVertical,
  PromoCode,
  SharedPlan,
} from '../types/checkout';
import { calculateOrderSummary } from '../utils/pricing';

const STORAGE_KEY = 'kilele_host_checkout_v3';

interface RemovedItemRecord {
  item: CartItem;
  index: number;
  removedAt: number;
}

export interface ActionToastRecord {
  message: string;
  id: number;
}

export interface CheckoutState {
  items: CartItem[];
  billingCycle: BillingCycle;
  currency: CurrencyCode;
  promoCode: PromoCode | null;
  customerInfo: CustomerInfo;
  currentStep: CheckoutStep;
  maxReachedStep: CheckoutStep;
  activeVertical: ProductVertical;
  domainMode: DomainMode;
  completedOrderRef: string | null;
  completedOrderReceipt: CompletedOrderReceipt | null;
}

export interface Step3CtaState {
  disabled: boolean;
  loading: boolean;
  disabledReason?: string;
}

const DEFAULT_CUSTOMER_INFO: CustomerInfo = {
  accountMode: 'guest',
  authTab: 'new',
  signedInUser: null,
  createAccount: true,
  fullName: '',
  email: '',
  phoneCountryCode: '+254',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Kenya',
  isBusinessPurchase: false,
  companyName: '',
  taxId: '',
};

const INITIAL_STATE: CheckoutState = {
  items: SEEDED_CART_ITEMS,
  billingCycle: 36,
  currency: 'KES',
  promoCode: null,
  customerInfo: DEFAULT_CUSTOMER_INFO,
  currentStep: 1,
  maxReachedStep: 1,
  activeVertical: 'shared',
  domainMode: 'later',
  completedOrderRef: null,
  completedOrderReceipt: null,
};

function buildDomainConfigLines(cfg: DomainConfig): string[] {
  if (cfg.registrationType === 'existing') {
    return ['DNS managed externally · Nameservers provided'];
  }

  const yearLabel = cfg.years === 1 ? '1 year' : `${cfg.years} years`;
  const privacyLabel =
    cfg.whoisSupport === 'unsupported'
      ? 'Privacy: Not supported by registry'
      : cfg.whoisPrivacy
      ? cfg.whoisSupport === 'free'
        ? 'Privacy: On (Free)'
        : `Privacy: On ($${cfg.whoisPriceYearlyUSD.toFixed(2)}/yr)`
      : 'Privacy: Off';
  const renewLabel = cfg.autoRenew ? 'Auto-renew: On' : 'Auto-renew: Off';

  return [`${yearLabel} · ${privacyLabel}`, renewLabel];
}

function loadInitialState(): CheckoutState {
  if (typeof window === 'undefined') {
    return INITIAL_STATE;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<CheckoutState>;
    if (!parsed || !Array.isArray(parsed.items)) {
      return INITIAL_STATE;
    }
    const hasHostingInCart = parsed.items.some(
      (i) =>
        i.vertical === 'shared' ||
        i.vertical === 'vps' ||
        i.vertical === 'dedicated' ||
        i.vertical === 'cloud'
    );
    return {
      ...INITIAL_STATE,
      ...parsed,
      domainMode:
        parsed.domainMode ?? (hasHostingInCart ? 'later' : 'register'),
      customerInfo: {
        ...DEFAULT_CUSTOMER_INFO,
        ...(parsed.customerInfo ?? {}),
      },
    };
  } catch {
    return INITIAL_STATE;
  }
}

type CheckoutAction =
  | { type: 'ADD_PRODUCT'; product: CatalogProduct }
  | { type: 'SELECT_SHARED_PLAN'; plan: SharedPlan }
  | { type: 'UPSERT_CONFIGURED_ITEM'; item: CartItem }
  | { type: 'UPSERT_BY_CATALOG_ID'; item: CartItem }
  | { type: 'REMOVE_BY_CATALOG_ID'; catalogId: string }
  | {
      type: 'UPSERT_CLOUD_BUNDLE';
      cloudItem: CartItem;
      k8sItem: CartItem | null;
    }
  | { type: 'ADD_DOMAIN_ITEM'; domainConfig: DomainConfig }
  | {
      type: 'UPDATE_DOMAIN_CONFIG';
      id: string;
      patch: Partial<DomainConfig>;
    }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'RESTORE_ITEM'; item: CartItem; index: number }
  | { type: 'SET_BILLING_CYCLE'; cycle: BillingCycle }
  | { type: 'SET_CURRENCY'; currency: CurrencyCode }
  | { type: 'SET_PROMO_CODE'; promo: PromoCode | null }
  | { type: 'UPDATE_CUSTOMER_INFO'; patch: Partial<CustomerInfo> }
  | { type: 'SET_STEP'; step: CheckoutStep }
  | { type: 'SET_ACTIVE_VERTICAL'; vertical: ProductVertical }
  | { type: 'SET_DOMAIN_MODE'; mode: DomainMode }
  | { type: 'SET_ORDER_COMPLETED'; orderRef: string; receipt: CompletedOrderReceipt }
  | { type: 'RESET_CHECKOUT' }
  | { type: 'SYNC_FROM_STORAGE'; nextState: CheckoutState };

function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction
): CheckoutState {
  switch (action.type) {
    case 'ADD_PRODUCT': {
      const existingIdx = state.items.findIndex(
        (i) => i.catalogId === action.product.id
      );
      if (existingIdx >= 0) {
        const nextItems = state.items.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return { ...state, items: nextItems, completedOrderRef: null };
      }

      const newItem: CartItem = {
        id: `item-${action.product.id}-${Date.now()}`,
        catalogId: action.product.id,
        vertical: action.product.vertical,
        name: action.product.name,
        configLines: action.product.configLines,
        basePriceUSD: action.product.basePriceUSD,
        renewalPriceUSD: action.product.renewalPriceUSD,
        setupFeeUSD: action.product.setupFeeUSD,
        quantity: 1,
        removable: true,
      };
      return {
        ...state,
        items: [...state.items, newItem],
        completedOrderRef: null,
      };
    }

    case 'SELECT_SHARED_PLAN': {
      const categoryLabel =
        action.plan.category === 'web'
          ? 'Web Hosting'
          : action.plan.category === 'wordpress'
          ? 'WordPress'
          : 'WooCommerce';
      const newSharedItem: CartItem = {
        id: `item-${action.plan.id}-${Date.now()}`,
        catalogId: action.plan.id,
        vertical: 'shared',
        name: `${categoryLabel} — ${action.plan.name}`,
        shortName: action.plan.shortName,
        configLines: [
          `${action.plan.features.websites} · ${action.plan.features.storage}`,
          `${action.plan.features.ssl} · ${action.plan.features.backups}`,
        ],
        basePriceUSD: action.plan.listPriceUSD,
        renewalPriceUSD: action.plan.listPriceUSD,
        setupFeeUSD: 0,
        quantity: 1,
        removable: true,
      };

      const backupsIncluded = BACKUPS_INCLUDED_PLAN_IDS.includes(
        action.plan.id
      );

      const filteredItems = backupsIncluded
        ? state.items.filter((i) => i.catalogId !== ADDON_IDS.BACKUPS)
        : state.items;

      const existingSharedIdx = filteredItems.findIndex(
        (i) => i.vertical === 'shared'
      );
      if (existingSharedIdx >= 0) {
        const nextItems = filteredItems.map((item, idx) =>
          idx === existingSharedIdx ? newSharedItem : item
        );
        return { ...state, items: nextItems, completedOrderRef: null };
      }

      return {
        ...state,
        items: [newSharedItem, ...filteredItems],
        completedOrderRef: null,
      };
    }

    case 'UPSERT_CONFIGURED_ITEM': {
      const idx = state.items.findIndex((i) => i.id === action.item.id);
      if (idx >= 0) {
        const nextItems = state.items.map((item, i) =>
          i === idx ? action.item : item
        );
        return { ...state, items: nextItems, completedOrderRef: null };
      }
      return {
        ...state,
        items: [...state.items, action.item],
        completedOrderRef: null,
      };
    }

    case 'UPSERT_BY_CATALOG_ID': {
      const idx = state.items.findIndex(
        (i) => i.catalogId === action.item.catalogId
      );
      if (idx >= 0) {
        const nextItems = state.items.map((item, i) =>
          i === idx ? { ...action.item, id: item.id } : item
        );
        return { ...state, items: nextItems, completedOrderRef: null };
      }
      return {
        ...state,
        items: [...state.items, action.item],
        completedOrderRef: null,
      };
    }

    case 'REMOVE_BY_CATALOG_ID': {
      return {
        ...state,
        items: state.items.filter((i) => i.catalogId !== action.catalogId),
      };
    }

    case 'UPSERT_CLOUD_BUNDLE': {
      const filtered = state.items.filter(
        (i) => i.id !== action.cloudItem.id && i.id !== 'cloud-k8s-addon'
      );
      const nextItems = [...filtered, action.cloudItem];
      if (action.k8sItem) {
        nextItems.push(action.k8sItem);
      }
      return {
        ...state,
        items: nextItems,
        completedOrderRef: null,
      };
    }

    case 'ADD_DOMAIN_ITEM': {
      const cfg = action.domainConfig;
      const existing = state.items.find(
        (i) =>
          i.vertical === 'domain' &&
          i.domainConfig?.fullDomain === cfg.fullDomain &&
          i.domainConfig?.registrationType === cfg.registrationType
      );
      if (existing) {
        return state;
      }

      const itemName =
        cfg.registrationType === 'existing'
          ? `Use existing domain: ${cfg.fullDomain}`
          : cfg.registrationType === 'transfer'
          ? `Domain transfer: ${cfg.fullDomain}`
          : cfg.fullDomain;

      const newItem: CartItem = {
        id: `domain-${cfg.registrationType}-${cfg.fullDomain}-${Date.now()}`,
        catalogId: `domain-${cfg.fullDomain}`,
        vertical: 'domain',
        name: itemName,
        configLines: buildDomainConfigLines(cfg),
        basePriceUSD: cfg.firstYearPriceUSD / 12,
        renewalPriceUSD: cfg.renewalYearlyUSD / 12,
        setupFeeUSD: 0,
        quantity: 1,
        removable: true,
        domainConfig: cfg,
      };

      return {
        ...state,
        items: [...state.items, newItem],
        completedOrderRef: null,
      };
    }

    case 'UPDATE_DOMAIN_CONFIG': {
      const nextItems = state.items.map((item) => {
        if (item.id !== action.id || !item.domainConfig) {
          return item;
        }
        const mergedCfg: DomainConfig = {
          ...item.domainConfig,
          ...action.patch,
        };
        if (mergedCfg.whoisSupport === 'unsupported') {
          mergedCfg.whoisPrivacy = false;
        }
        return {
          ...item,
          domainConfig: mergedCfg,
          configLines: buildDomainConfigLines(mergedCfg),
        };
      });
      return {
        ...state,
        items: nextItems,
      };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };
    }

    case 'RESTORE_ITEM': {
      const alreadyExists = state.items.some(
        (item) => item.id === action.item.id
      );
      if (alreadyExists) {
        return state;
      }
      const nextItems = [...state.items];
      const insertAt = Math.min(Math.max(0, action.index), nextItems.length);
      nextItems.splice(insertAt, 0, action.item);
      return { ...state, items: nextItems };
    }

    case 'SET_BILLING_CYCLE':
      return { ...state, billingCycle: action.cycle };

    case 'SET_CURRENCY':
      return { ...state, currency: action.currency };

    case 'SET_PROMO_CODE':
      return { ...state, promoCode: action.promo };

    case 'UPDATE_CUSTOMER_INFO':
      return {
        ...state,
        customerInfo: { ...state.customerInfo, ...action.patch },
      };

    case 'SET_STEP': {
      const nextMax =
        action.step > state.maxReachedStep
          ? action.step
          : state.maxReachedStep;
      return {
        ...state,
        currentStep: action.step,
        maxReachedStep: nextMax,
      };
    }

    case 'SET_ACTIVE_VERTICAL':
      return { ...state, activeVertical: action.vertical };

    case 'SET_DOMAIN_MODE':
      return { ...state, domainMode: action.mode };

    case 'SET_ORDER_COMPLETED':
      return {
        ...state,
        completedOrderRef: action.orderRef,
        completedOrderReceipt: action.receipt,
        items: [],
      };

    case 'RESET_CHECKOUT':
      return {
        ...INITIAL_STATE,
      };

    case 'SYNC_FROM_STORAGE':
      return action.nextState;

    default:
      return state;
  }
}

interface CartContextValue {
  state: CheckoutState;
  summary: OrderSummaryTotals;
  isSummaryLoading: boolean;
  removedItemNotice: RemovedItemRecord | null;
  actionToast: ActionToastRecord | null;
  hasHostingPlan: boolean;
  backupsIncludedInPlan: boolean;
  addProduct: (product: CatalogProduct) => void;
  selectSharedPlan: (plan: SharedPlan) => void;
  upsertConfiguredItem: (item: CartItem, toastMessage?: string) => void;
  upsertByCatalogId: (item: CartItem) => void;
  removeByCatalogId: (catalogId: string) => void;
  upsertCloudBundle: (
    cloudItem: CartItem,
    k8sItem: CartItem | null,
    toastMessage?: string
  ) => void;
  addDomainItem: (domainConfig: DomainConfig) => void;
  updateDomainConfig: (id: string, patch: Partial<DomainConfig>) => void;
  removeItem: (id: string) => void;
  undoRemove: () => void;
  dismissUndo: () => void;
  dismissActionToast: () => void;
  setBillingCycle: (cycle: BillingCycle) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setPromoCode: (promo: PromoCode | null) => void;
  updateCustomerInfo: (patch: Partial<CustomerInfo>) => void;
  goToStep: (step: CheckoutStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setActiveVertical: (vertical: ProductVertical) => void;
  setDomainMode: (mode: DomainMode) => void;
  registerStep2Submit: (handler: (() => void) | null) => void;
  triggerStep2Submit: () => void;
  registerStep3Submit: (handler: (() => void) | null) => void;
  triggerStep3Submit: () => void;
  step3CtaState: Step3CtaState;
  setStep3CtaState: (next: Step3CtaState) => void;
  completeOrder: (
    paymentMethod?: PaymentMethod,
    paymentMethodLabel?: string
  ) => void;
  notifyActionToast: (message: string) => void;
  summaryDrawerOpen: boolean;
  setSummaryDrawerOpen: (open: boolean) => void;
  mobileVerticalDetailOpen: boolean;
  setMobileVerticalDetailOpen: (open: boolean) => void;
  language: 'en' | 'sw';
  setLanguage: (lang: 'en' | 'sw') => void;
  resetCheckout: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    checkoutReducer,
    undefined,
    loadInitialState
  );
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);
  const [removedItemNotice, setRemovedItemNotice] =
    useState<RemovedItemRecord | null>(null);
  const [actionToast, setActionToast] = useState<ActionToastRecord | null>(
    null
  );
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [mobileVerticalDetailOpen, setMobileVerticalDetailOpen] =
    useState(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [step3CtaState, setStep3CtaState] = useState<Step3CtaState>({
    disabled: true,
    loading: false,
    disabledReason: 'Agree to the Terms of Service above to continue',
  });

  const skeletonTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const step2SubmitRef = useRef<(() => void) | null>(null);
  const step3SubmitRef = useRef<(() => void) | null>(null);

  const registerStep2Submit = useCallback((handler: (() => void) | null) => {
    step2SubmitRef.current = handler;
  }, []);

  const triggerStep2Submit = useCallback(() => {
    if (step2SubmitRef.current) {
      step2SubmitRef.current();
    } else {
      dispatch({ type: 'SET_STEP', step: 3 });
    }
  }, []);

  const registerStep3Submit = useCallback((handler: (() => void) | null) => {
    step3SubmitRef.current = handler;
  }, []);

  const triggerStep3Submit = useCallback(() => {
    if (step3SubmitRef.current) {
      step3SubmitRef.current();
    }
  }, []);

  const triggerSummarySkeleton = useCallback((durationMs: number = 600) => {
    setIsSummaryLoading(true);
    if (skeletonTimerRef.current) {
      window.clearTimeout(skeletonTimerRef.current);
    }
    skeletonTimerRef.current = window.setTimeout(() => {
      setIsSummaryLoading(false);
    }, durationMs);
  }, []);

  const showActionToast = useCallback((message: string) => {
    setActionToast({ message, id: Date.now() });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setActionToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    triggerSummarySkeleton(600);
    return () => {
      if (skeletonTimerRef.current) window.clearTimeout(skeletonTimerRef.current);
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [triggerSummarySkeleton]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as CheckoutState;
          if (parsed && Array.isArray(parsed.items)) {
            dispatch({ type: 'SYNC_FROM_STORAGE', nextState: parsed });
          }
        } catch {
          // Ignore malformed storage payload
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const hasHostingPlan = useMemo(
    () =>
      state.items.some(
        (i) =>
          i.vertical === 'shared' ||
          i.vertical === 'vps' ||
          i.vertical === 'dedicated' ||
          i.vertical === 'cloud'
      ),
    [state.items]
  );

  const backupsIncludedInPlan = useMemo(
    () =>
      state.items.some(
        (i) =>
          i.vertical === 'shared' &&
          BACKUPS_INCLUDED_PLAN_IDS.includes(i.catalogId)
      ),
    [state.items]
  );

  const addProduct = useCallback(
    (product: CatalogProduct) => {
      dispatch({ type: 'ADD_PRODUCT', product });
      showActionToast(`Added ${product.name} to your order`);
    },
    [showActionToast]
  );

  const selectSharedPlan = useCallback(
    (plan: SharedPlan) => {
      const previousShared = state.items.find((i) => i.vertical === 'shared');
      if (previousShared && previousShared.catalogId === plan.id) {
        return;
      }
      dispatch({ type: 'SELECT_SHARED_PLAN', plan });
      if (previousShared) {
        const prevShort = previousShared.shortName ?? previousShared.name;
        showActionToast(`Swapped ${prevShort} for ${plan.shortName}`);
      } else {
        showActionToast(`Selected ${plan.name} plan`);
      }
    },
    [state.items, showActionToast]
  );

  const upsertConfiguredItem = useCallback(
    (item: CartItem, toastMessage?: string) => {
      dispatch({ type: 'UPSERT_CONFIGURED_ITEM', item });
      if (toastMessage) {
        showActionToast(toastMessage);
      }
    },
    [showActionToast]
  );

  const upsertByCatalogId = useCallback(
    (item: CartItem) => {
      const exists = state.items.some((i) => i.catalogId === item.catalogId);
      dispatch({ type: 'UPSERT_BY_CATALOG_ID', item });
      showActionToast(
        exists
          ? `Updated ${item.name} in your order`
          : `Added ${item.name} to your order`
      );
    },
    [state.items, showActionToast]
  );

  const removeByCatalogId = useCallback(
    (catalogId: string) => {
      const found = state.items.find((i) => i.catalogId === catalogId);
      dispatch({ type: 'REMOVE_BY_CATALOG_ID', catalogId });
      if (found) {
        showActionToast(`Removed ${found.name} from your order`);
      }
    },
    [state.items, showActionToast]
  );

  const upsertCloudBundle = useCallback(
    (cloudItem: CartItem, k8sItem: CartItem | null, toastMessage?: string) => {
      dispatch({ type: 'UPSERT_CLOUD_BUNDLE', cloudItem, k8sItem });
      if (toastMessage) {
        showActionToast(toastMessage);
      }
    },
    [showActionToast]
  );

  const addDomainItem = useCallback(
    (domainConfig: DomainConfig) => {
      dispatch({ type: 'ADD_DOMAIN_ITEM', domainConfig });
      const msg =
        domainConfig.registrationType === 'existing'
          ? `Connected ${domainConfig.fullDomain}`
          : domainConfig.registrationType === 'transfer'
          ? `Added transfer for ${domainConfig.fullDomain}`
          : `Added ${domainConfig.fullDomain} to your order`;
      showActionToast(msg);
    },
    [showActionToast]
  );

  const updateDomainConfig = useCallback(
    (id: string, patch: Partial<DomainConfig>) => {
      dispatch({ type: 'UPDATE_DOMAIN_CONFIG', id, patch });
    },
    []
  );

  const removeItem = useCallback(
    (id: string) => {
      const idx = state.items.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const target = state.items[idx];
      dispatch({ type: 'REMOVE_ITEM', id });

      setRemovedItemNotice({
        item: target,
        index: idx,
        removedAt: Date.now(),
      });

      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
      undoTimerRef.current = window.setTimeout(() => {
        setRemovedItemNotice(null);
      }, 5000);
    },
    [state.items]
  );

  const undoRemove = useCallback(() => {
    if (!removedItemNotice) return;
    dispatch({
      type: 'RESTORE_ITEM',
      item: removedItemNotice.item,
      index: removedItemNotice.index,
    });
    setRemovedItemNotice(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
  }, [removedItemNotice]);

  const dismissUndo = useCallback(() => {
    setRemovedItemNotice(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
  }, []);

  const dismissActionToast = useCallback(() => {
    setActionToast(null);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  const setBillingCycle = useCallback((cycle: BillingCycle) => {
    dispatch({ type: 'SET_BILLING_CYCLE', cycle });
  }, []);

  const setCurrency = useCallback(
    (currency: CurrencyCode) => {
      dispatch({ type: 'SET_CURRENCY', currency });
      triggerSummarySkeleton(400);
    },
    [triggerSummarySkeleton]
  );

  const setPromoCode = useCallback((promo: PromoCode | null) => {
    dispatch({ type: 'SET_PROMO_CODE', promo });
  }, []);

  const updateCustomerInfo = useCallback((patch: Partial<CustomerInfo>) => {
    dispatch({ type: 'UPDATE_CUSTOMER_INFO', patch });
  }, []);

  const goToStep = useCallback(
    (step: CheckoutStep) => {
      if (step <= state.maxReachedStep || step === state.currentStep + 1) {
        dispatch({ type: 'SET_STEP', step });
      }
    },
    [state.currentStep, state.maxReachedStep]
  );

  const goToNextStep = useCallback(() => {
    if (state.currentStep < 3) {
      dispatch({
        type: 'SET_STEP',
        step: (state.currentStep + 1) as CheckoutStep,
      });
    }
  }, [state.currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (state.currentStep > 1) {
      dispatch({
        type: 'SET_STEP',
        step: (state.currentStep - 1) as CheckoutStep,
      });
    }
  }, [state.currentStep]);

  const setActiveVertical = useCallback((vertical: ProductVertical) => {
    dispatch({ type: 'SET_ACTIVE_VERTICAL', vertical });
    setMobileVerticalDetailOpen(true);
  }, []);

  const setDomainMode = useCallback((mode: DomainMode) => {
    dispatch({ type: 'SET_DOMAIN_MODE', mode });
  }, []);

  const summary = useMemo(
    () =>
      calculateOrderSummary(
        state.items,
        state.billingCycle,
        state.promoCode,
        state.currency,
        state.customerInfo.country
      ),
    [
      state.items,
      state.billingCycle,
      state.promoCode,
      state.currency,
      state.customerInfo.country,
    ]
  );

  const completeOrder = useCallback(
    (
      paymentMethod: PaymentMethod = 'mpesa',
      paymentMethodLabel: string = 'M-Pesa Express'
    ) => {
      const orderRef = `KH-${Math.floor(10000 + Math.random() * 90000)}`;
      const customerName =
        state.customerInfo.fullName.trim() ||
        state.customerInfo.signedInUser?.name ||
        'Amina Otieno';
      const customerEmail =
        state.customerInfo.email.trim() ||
        state.customerInfo.signedInUser?.email ||
        'amina@example.com';

      const hasDomainRegistration = state.items.some(
        (i) =>
          i.vertical === 'domain' &&
          i.domainConfig?.registrationType !== 'existing'
      );
      const hasHosting = state.items.some(
        (i) =>
          i.vertical === 'shared' ||
          i.vertical === 'vps' ||
          i.vertical === 'cloud' ||
          i.vertical === 'addon'
      );
      const hasDedicated = state.items.some(
        (i) => i.vertical === 'dedicated'
      );

      const receipt: CompletedOrderReceipt = {
        orderRef,
        customerName,
        customerEmail,
        paymentMethod,
        paymentMethodLabel,
        currency: state.currency,
        summary,
        hasDomainRegistration,
        hasHosting,
        hasDedicated,
        completedAtIso: new Date().toISOString(),
      };

      setRemovedItemNotice(null);
      dispatch({ type: 'SET_ORDER_COMPLETED', orderRef, receipt });
    },
    [state.currency, state.customerInfo, state.items, summary]
  );

  const resetCheckout = useCallback(() => {
    dispatch({ type: 'RESET_CHECKOUT' });
    triggerSummarySkeleton(600);
  }, [triggerSummarySkeleton]);

  const value = useMemo(
    () => ({
      state,
      summary,
      isSummaryLoading,
      removedItemNotice,
      actionToast,
      hasHostingPlan,
      backupsIncludedInPlan,
      addProduct,
      selectSharedPlan,
      upsertConfiguredItem,
      upsertByCatalogId,
      removeByCatalogId,
      upsertCloudBundle,
      addDomainItem,
      updateDomainConfig,
      removeItem,
      undoRemove,
      dismissUndo,
      dismissActionToast,
      setBillingCycle,
      setCurrency,
      setPromoCode,
      updateCustomerInfo,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      setActiveVertical,
      setDomainMode,
      registerStep2Submit,
      triggerStep2Submit,
      registerStep3Submit,
      triggerStep3Submit,
      step3CtaState,
      setStep3CtaState,
      completeOrder,
      notifyActionToast: showActionToast,
      summaryDrawerOpen,
      setSummaryDrawerOpen,
      mobileVerticalDetailOpen,
      setMobileVerticalDetailOpen,
      language,
      setLanguage,
      resetCheckout,
    }),
    [
      state,
      summary,
      isSummaryLoading,
      removedItemNotice,
      actionToast,
      hasHostingPlan,
      backupsIncludedInPlan,
      addProduct,
      selectSharedPlan,
      upsertConfiguredItem,
      upsertByCatalogId,
      removeByCatalogId,
      upsertCloudBundle,
      addDomainItem,
      updateDomainConfig,
      removeItem,
      undoRemove,
      dismissUndo,
      dismissActionToast,
      setBillingCycle,
      setCurrency,
      setPromoCode,
      updateCustomerInfo,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      setActiveVertical,
      setDomainMode,
      registerStep2Submit,
      triggerStep2Submit,
      registerStep3Submit,
      triggerStep3Submit,
      step3CtaState,
      completeOrder,
      showActionToast,
      summaryDrawerOpen,
      mobileVerticalDetailOpen,
      language,
      resetCheckout,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
