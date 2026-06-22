import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type ProductId =
  | 'freestyle_libre_3_plus'
  | 'dexcom_g7'
  | 'lymphedema_compression'
  | 'diabetic_shoes';

interface Product {
  id: ProductId;
  category: 'cgm' | 'compression' | 'shoes';
  name: string;
  kicker: string;
  image: string;
}

interface SmartySuggestion {
  street_line?: string;
  secondary?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

interface AddressSnapshot {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipcode: string;
}

interface GoogleReview {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
}

interface GooglePlace {
  rating: number;
  user_ratings_total: string | number;
  reviews: GoogleReview[];
}

interface StateOption {
  code: string;
  name: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    QMS_SMARTY_EMBEDDED_KEY?: string;
    crypto: Crypto;
  }
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly products: Product[] = [
    {
      id: 'freestyle_libre_3_plus',
      category: 'cgm',
      name: 'Freestyle Libre 3+',
      kicker: 'CGM',
      image: 'assets/images/cgm.png',
    },
    {
      id: 'dexcom_g7',
      category: 'cgm',
      name: 'Dexcom G7',
      kicker: 'CGM',
      image: 'assets/images/dexcom.webp',
    },
    {
      id: 'lymphedema_compression',
      category: 'compression',
      name: 'Lymphedema',
      kicker: 'COMPRESSION',
      image: 'assets/images/compression.png',
    },
    {
      id: 'diabetic_shoes',
      category: 'shoes',
      name: 'Diabetic Shoes',
      kicker: 'SHOES',
      image: 'assets/images/shoe.png',
    },
  ];

  readonly stateOptions: StateOption[] = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
  ];

  readonly stateCodes = new Set(this.stateOptions.map((option) => option.code));

  selectedProductIds = new Set<ProductId>();
  prescribedCgmBefore = '';
  lymphedema = '';
  garmentType = '';
  acknowledgement = false;

  personal = {
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    phone: '',
    gender: '',
  };

  shipping: AddressSnapshot = {
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipcode: '',
  };

  health = {
    diabetes: '',
    insulin: '',
  };

  errors: Record<string, string> = {};
  validationAttempts = {
    personal: false,
    shipping: false,
    health: false,
    acknowledgement: false,
  };

  viewedSteps = new Set<string>();
  completedSteps = new Set<string>();
  activeValidationErrors: Record<string, boolean> = {};

  fallbackPlace: GooglePlace = {
    rating: 5,
    user_ratings_total: '200+',
    reviews: [
      {
        author_name: 'Google Reviewer',
        profile_photo_url: 'assets/images/G_bubble.png',
        rating: 5,
        text: 'Great service and an easy process from start to finish.',
        relative_time_description: 'Recent review',
      },
      {
        author_name: 'Google Reviewer',
        profile_photo_url: 'assets/images/G_bubble.png',
        rating: 5,
        text: 'Helpful team, quick follow-up, and clear communication.',
        relative_time_description: 'Recent review',
      },
    ],
  };

  googlePlace = this.fallbackPlace;
  reviews: GoogleReview[] = this.fallbackPlace.reviews;
  currentReviewIndex = 0;
  private reviewTimer?: number;

  addressSuggestions: SmartySuggestion[] = [];
  activeAddressSuggestionIndex = -1;
  addressAutocompleteStatus = '';
  private addressSuggestionTimer?: number;
  selectedSmartyAddress: AddressSnapshot | null = null;
  smartyAddressAltered = false;
  smartyAddressConfirmed = false;
  showAddressReview = false;

  private applicationId = '';
  private attribution: Record<string, string> = {};

  ngOnInit(): void {
    this.applicationId = this.getApplicationId();
    this.attribution = this.captureAttribution();
    this.loadReviews();
    this.trackEvent('landing_view', {
      step_id: 'landing',
      flow_name: 'qms_application',
    });
    this.trackVisibleStepViews();
    this.scheduleAutofillSync();
  }

  get currentReview(): GoogleReview {
    return this.reviews[this.currentReviewIndex] || this.fallbackPlace.reviews[0];
  }

  get hasCgmSelected(): boolean {
    return this.products.some(
      (product) => product.category === 'cgm' && this.selectedProductIds.has(product.id),
    );
  }

  get hasCompressionSelected(): boolean {
    return this.selectedProductIds.has('lymphedema_compression');
  }

  get selectedProducts(): ProductId[] {
    return Array.from(this.selectedProductIds);
  }

  get personalUnlocked(): boolean {
    return this.hasCompletedProductStep() && this.hasCompletedCgmStep() && this.hasCompletedCompressionStep();
  }

  get shippingUnlocked(): boolean {
    return this.personalUnlocked && this.isPersonalValid();
  }

  get healthUnlocked(): boolean {
    return this.shippingUnlocked && this.isShippingValid();
  }

  get acknowledgementUnlocked(): boolean {
    return this.healthUnlocked && this.isHealthValid();
  }

  get orderReady(): boolean {
    return this.acknowledgementUnlocked && this.acknowledgement;
  }

  get healthRequiresInsulin(): boolean {
    return Boolean(this.health.diabetes && this.health.diabetes !== 'not_diabetic');
  }

  get addressReviewText(): string {
    return this.renderAddressForReview(this.shipping);
  }

  get activeAddressSuggestionId(): string | null {
    return this.activeAddressSuggestionIndex >= 0
      ? `addressSuggestion-${this.activeAddressSuggestionIndex}`
      : null;
  }

  get personalLockedMessage(): string {
    if (!this.hasCompletedProductStep()) {
      return 'Select at least one product to continue.';
    }
    if (!this.hasCompletedCgmStep()) {
      return 'Answer the CGM prescription question to continue.';
    }
    if (!this.hasCompletedCompressionStep()) {
      return 'Complete the compression questions to continue.';
    }
    return 'Complete product questions to continue.';
  }

  get shippingLockedMessage(): string {
    const missing = this.personalMissingFields();
    return missing.length
      ? `Complete personal information: ${missing.join(', ')}.`
      : 'Complete personal information to continue.';
  }

  get healthLockedMessage(): string {
    const missing = this.shippingMissingFields();
    return missing.length
      ? `Complete shipping information: ${missing.join(', ')}.`
      : 'Complete shipping information to continue.';
  }

  get acknowledgementLockedMessage(): string {
    const missing = this.healthMissingFields();
    return missing.length
      ? `Complete health history: ${missing.join(', ')}.`
      : 'Complete health history to continue.';
  }

  stepNumber(step: 'cgm' | 'compression' | 'personal' | 'shipping' | 'health'): number {
    let count = 2;
    if (step === 'cgm') {
      return count;
    }
    if (this.hasCgmSelected) {
      count += 1;
    }
    if (step === 'compression') {
      return count;
    }
    if (this.hasCompressionSelected) {
      count += 1;
    }
    if (step === 'personal') {
      return count;
    }
    if (step === 'shipping') {
      return count + 1;
    }
    return count + 2;
  }

  toggleProduct(product: Product): void {
    if (this.selectedProductIds.has(product.id)) {
      this.selectedProductIds.delete(product.id);
    } else {
      this.selectedProductIds.add(product.id);
    }

    if (!this.hasCgmSelected) {
      this.prescribedCgmBefore = '';
    }
    if (!this.hasCompressionSelected) {
      this.lymphedema = '';
      this.garmentType = '';
    }

    this.clearValidationState();
    this.trackEvent('product_selected', {
      product_id: product.id,
      product_category: product.category,
      product_name: product.name,
      selected: this.selectedProductIds.has(product.id),
      selected_products: this.selectedProducts,
    });
    this.trackEvent('branch_selected', {
      branch_name: 'product',
      branch_value: product.id,
      branch_selected: this.selectedProductIds.has(product.id),
      selected_products: this.selectedProducts,
    });

    if (this.selectedProducts.length) {
      this.trackStepComplete('product_selection', {
        selected_products: this.selectedProducts,
      });
    }

    this.trackVisibleStepViews();
  }

  setCgmHistory(value: string): void {
    this.prescribedCgmBefore = value;
    this.trackEvent('branch_selected', {
      step_id: 'cgm_prescription_history',
      branch_name: 'prescribed_cgm_before',
      branch_value: value,
    });
    this.trackStepComplete('cgm_prescription_history', {
      prescribed_cgm_before: value,
    });
    this.trackVisibleStepViews();
  }

  onCompressionChange(fieldName: 'lymphedema' | 'garmentType', value: string): void {
    if (fieldName === 'lymphedema') {
      this.lymphedema = value;
    } else {
      this.garmentType = value;
    }
    this.trackEvent('branch_selected', {
      step_id: 'compression_questions',
      branch_name: fieldName === 'lymphedema' ? 'has_lymphedema' : 'compression_garment_type',
      branch_value: value,
    });

    if (this.lymphedema && this.garmentType) {
      this.trackStepComplete('compression_questions', {
        has_lymphedema: this.lymphedema,
        compression_garment_type: this.garmentType,
      });
    }
    this.trackVisibleStepViews();
  }

  onPersonalInput(field?: keyof typeof this.personal): void {
    if (field === 'dob') {
      this.personal.dob = this.formatDobInput(this.personal.dob);
    }
    if (field === 'phone') {
      this.personal.phone = this.formatPhoneInput(this.personal.phone);
    }
    if (field === 'email') {
      const emailEntered = this.personal.email.trim().length > 0;
      if (emailEntered && !this.isValidEmail(this.personal.email) && !this.activeValidationErrors['email']) {
        this.activeValidationErrors['email'] = true;
        this.trackEvent('validation_error', {
          step_id: 'personal_information',
          field_id: 'email',
          validation_rule: 'email_format',
        });
      }
      if (this.isValidEmail(this.personal.email)) {
        this.activeValidationErrors['email'] = false;
      }
    }

    this.validatePersonal(true);
    if (this.isPersonalValid()) {
      this.trackStepComplete('personal_information', {
        required_fields_completed: true,
      });
    }
    this.trackVisibleStepViews();
  }

  onShippingInput(field?: keyof AddressSnapshot): void {
    if (field === 'state') {
      this.shipping.state = this.shipping.state.toUpperCase();
    }
    if (field === 'address1') {
      this.handleManualAddressOneEdit();
    }
    this.watchSmartyAddressChanges();
    this.validateShipping(true);
    if (field === 'address1') {
      window.clearTimeout(this.addressSuggestionTimer);
      this.addressSuggestionTimer = window.setTimeout(() => {
        this.fetchAddressSuggestions(this.shipping.address1.trim());
      }, 250);
    }
    if (this.isShippingValid()) {
      if (!this.completedSteps.has('shipping_information')) {
        this.trackEvent('modal_save', {
          step_id: 'shipping_information',
          modal_id: 'shipping_address',
        });
      }
      this.trackStepComplete('shipping_information', {
        required_fields_completed: true,
      });
    }
    this.trackVisibleStepViews();
  }

  onAddressOneChange(value: string): void {
    this.shipping.address1 = value;
    this.onShippingInput('address1');
  }

  onShippingValueChange(field: keyof AddressSnapshot, value: string): void {
    this.shipping[field] = value;
    this.onShippingInput(field);
  }

  onHealthChange(fieldName: 'diabetes' | 'insulin', value: string): void {
    this.health[fieldName] = value;
    if (fieldName === 'diabetes' && value === 'not_diabetic') {
      this.health.insulin = '';
      this.setError('insulin', '');
    }
    this.trackEvent('branch_selected', {
      step_id: 'health_history',
      branch_name: fieldName === 'diabetes' ? 'diabetes_type' : 'uses_insulin',
      branch_value: value,
    });
    this.validateHealth(true);
    if (this.isHealthValid()) {
      this.trackStepComplete('health_history', {
        diabetes_type: this.health.diabetes,
        uses_insulin: this.healthRequiresInsulin ? this.health.insulin : 'not_applicable',
      });
    }
    this.trackVisibleStepViews();
  }

  onAcknowledgementChange(): void {
    this.validateAcknowledgement(this.validationAttempts.acknowledgement);
    if (this.acknowledgement && this.orderReady) {
      this.trackStepComplete('acknowledgement', {
        consent_checked: true,
      });
    }
  }

  startOrder(): void {
    this.scheduleAutofillSync();
    this.watchSmartyAddressChanges();

    if (!this.orderReady) {
      this.showBlockingStepErrors();
      return;
    }

    if (this.shouldConfirmSmartyAddressChange()) {
      this.showAddressReview = true;
      this.trackEvent('modal_view', {
        step_id: 'shipping_information',
        modal_id: 'shipping_address_review',
      });
      return;
    }

    this.completeStartOrder();
  }

  confirmAddress(): void {
    this.smartyAddressConfirmed = true;
    this.showAddressReview = false;
    this.trackEvent('modal_save', {
      step_id: 'shipping_information',
      modal_id: 'shipping_address_review',
    });
    this.completeStartOrder();
  }

  showBlockingStepErrors(): boolean {
    if (!this.personalUnlocked) {
      return false;
    }
    if (!this.isPersonalValid()) {
      this.validationAttempts.personal = true;
      this.validatePersonal(true);
      this.scrollToFirstValidationIssue();
      return false;
    }
    if (!this.shippingUnlocked) {
      return false;
    }
    if (!this.isShippingValid()) {
      this.validationAttempts.shipping = true;
      this.validateShipping(true);
      this.scrollToFirstValidationIssue();
      return false;
    }
    if (!this.healthUnlocked) {
      return false;
    }
    if (!this.isHealthValid()) {
      this.validationAttempts.health = true;
      this.validateHealth(true);
      this.scrollToFirstValidationIssue();
      return false;
    }
    if (!this.acknowledgementUnlocked) {
      return false;
    }
    if (!this.acknowledgement) {
      this.validationAttempts.acknowledgement = true;
      this.validateAcknowledgement(true);
      this.scrollToFirstValidationIssue();
      return false;
    }
    return true;
  }

  setActiveAddressSuggestion(index: number): void {
    const maxIndex = this.addressSuggestions.length - 1;
    if (maxIndex < 0) {
      return;
    }
    this.activeAddressSuggestionIndex = Math.max(0, Math.min(index, maxIndex));
  }

  handleAddressKeydown(event: KeyboardEvent): void {
    if (!this.addressSuggestions.length) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setActiveAddressSuggestion(this.activeAddressSuggestionIndex + 1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setActiveAddressSuggestion(this.activeAddressSuggestionIndex - 1);
    }
    if (event.key === 'Enter' && this.activeAddressSuggestionIndex >= 0) {
      event.preventDefault();
      this.applyAddressSuggestion(this.addressSuggestions[this.activeAddressSuggestionIndex]);
    }
    if (event.key === 'Escape') {
      this.hideAddressSuggestions();
    }
  }

  applyAddressSuggestion(suggestion: SmartySuggestion): void {
    if (!suggestion) {
      return;
    }
    this.shipping.address1 = suggestion.street_line || '';
    this.shipping.address2 = suggestion.secondary || '';
    this.shipping.city = suggestion.city || '';
    this.shipping.state = (suggestion.state || '').toUpperCase();
    this.shipping.zipcode = suggestion.zipcode || '';
    this.selectedSmartyAddress = { ...this.shipping };
    this.smartyAddressAltered = false;
    this.smartyAddressConfirmed = false;
    this.hideAddressSuggestions();
    this.onShippingInput();
  }

  formatAddressSuggestion(suggestion: SmartySuggestion): string {
    const street = [suggestion.street_line, suggestion.secondary].filter(Boolean).join(' ');
    const cityStateZip = [
      suggestion.city,
      [suggestion.state, suggestion.zipcode].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ');
    return [street, cityStateZip].filter(Boolean).join(', ');
  }

  hideAddressSuggestions(): void {
    this.addressSuggestions = [];
    this.activeAddressSuggestionIndex = -1;
  }

  previousReview(): void {
    this.showReview(this.currentReviewIndex - 1);
    this.startReviewRotation();
  }

  nextReview(): void {
    this.showReview(this.currentReviewIndex + 1);
    this.startReviewRotation();
  }

  stars(count: number | undefined): number[] {
    const activeCount = Math.max(0, Math.min(5, Math.floor(Number(count) || 0)));
    return Array.from({ length: 5 }, (_, index) => (index < activeCount ? 1 : 0));
  }

  private clearValidationState(): void {
    this.errors = {};
    this.validationAttempts = {
      personal: false,
      shipping: false,
      health: false,
      acknowledgement: false,
    };
    this.selectedSmartyAddress = null;
    this.smartyAddressAltered = false;
    this.smartyAddressConfirmed = false;
  }

  private hasCompletedProductStep(): boolean {
    return this.selectedProductIds.size > 0;
  }

  private hasCompletedCgmStep(): boolean {
    return !this.hasCgmSelected || Boolean(this.prescribedCgmBefore);
  }

  private hasCompletedCompressionStep(): boolean {
    return !this.hasCompressionSelected || Boolean(this.lymphedema && this.garmentType);
  }

  private isPersonalValid(): boolean {
    return Boolean(
      this.personal.firstName.trim() &&
        this.personal.lastName.trim() &&
        this.isValidDob(this.personal.dob) &&
        this.isValidEmail(this.personal.email) &&
        this.personal.phone.trim() &&
        this.personal.gender,
    );
  }

  private isShippingValid(): boolean {
    return Boolean(
      this.shipping.address1.trim() &&
        this.shipping.city.trim() &&
        this.isValidState(this.shipping.state) &&
        this.isValidZip(this.shipping.zipcode),
    );
  }

  private isHealthValid(): boolean {
    return Boolean(this.health.diabetes && (!this.healthRequiresInsulin || this.health.insulin));
  }

  private validatePersonal(showErrors = false): boolean {
    if (!showErrors) {
      return this.isPersonalValid();
    }
    this.setError('firstName', this.personal.firstName.trim() ? '' : 'First name is required.');
    this.setError('lastName', this.personal.lastName.trim() ? '' : 'Last name is required.');
    this.setError(
      'dob',
      !this.personal.dob.trim()
        ? 'Date of birth is required.'
        : this.isValidDob(this.personal.dob)
          ? ''
          : 'Enter a valid date of birth.',
    );
    this.setError(
      'email',
      !this.personal.email.trim()
        ? 'Email address is required.'
        : this.isValidEmail(this.personal.email)
          ? ''
          : 'Enter a valid email address.',
    );
    this.setError('phone', this.personal.phone.trim() ? '' : 'Phone number is required.');
    this.setError('gender', this.personal.gender ? '' : 'Gender is required.');
    return this.isPersonalValid();
  }

  private validateShipping(showErrors = false): boolean {
    if (!showErrors) {
      return this.isShippingValid();
    }
    this.setError('address1', this.shipping.address1.trim() ? '' : 'Address 1 is required.');
    this.setError('city', this.shipping.city.trim() ? '' : 'City is required.');
    this.setError(
      'state',
      !this.shipping.state.trim()
        ? 'State is required.'
        : this.isValidState(this.shipping.state)
          ? ''
          : 'Select a valid 2-letter state.',
    );
    this.setError(
      'zipcode',
      !this.shipping.zipcode.trim()
        ? 'Zip code is required.'
        : this.isValidZip(this.shipping.zipcode)
          ? ''
          : 'Enter a valid 5-digit ZIP code.',
    );
    return this.isShippingValid();
  }

  private validateHealth(showErrors = false): boolean {
    if (!showErrors) {
      return this.isHealthValid();
    }
    this.setError('diabetes', this.health.diabetes ? '' : 'Diabetes type is required.');
    this.setError('insulin', !this.healthRequiresInsulin || this.health.insulin ? '' : 'Insulin use is required.');
    return this.isHealthValid();
  }

  private validateAcknowledgement(showErrors = false): boolean {
    if (showErrors) {
      this.setError('acknowledgement', this.acknowledgement ? '' : 'Consent is required.');
    }
    return this.acknowledgement;
  }

  private setError(field: string, message: string): void {
    if (message) {
      this.errors[field] = message;
    } else {
      delete this.errors[field];
    }
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private isValidDob(value: string): boolean {
    const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) {
      return false;
    }
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date < new Date()
    );
  }

  private isValidState(value: string): boolean {
    return this.stateCodes.has(value.trim().toUpperCase());
  }

  private isValidZip(value: string): boolean {
    return /^\d{5}(?:-\d{4})?$/.test(value.trim());
  }

  private formatDobInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const parts: string[] = [];
    if (digits.length > 0) {
      parts.push(digits.slice(0, 2));
    }
    if (digits.length > 2) {
      parts.push(digits.slice(2, 4));
    }
    if (digits.length > 4) {
      parts.push(digits.slice(4, 8));
    }
    return parts.join('/');
  }

  private formatPhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) {
      return digits;
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  private handleManualAddressOneEdit(): void {
    if (!this.selectedSmartyAddress || this.addressesMatch(this.shipping, this.selectedSmartyAddress)) {
      return;
    }
    this.shipping.city = '';
    this.shipping.state = '';
    this.shipping.zipcode = '';
    this.selectedSmartyAddress = null;
    this.smartyAddressAltered = false;
    this.smartyAddressConfirmed = false;
    this.setError('city', 'City is required after changing Address 1.');
    this.setError('state', 'State is required after changing Address 1.');
    this.setError('zipcode', 'Zip code is required after changing Address 1.');
  }

  private personalMissingFields(): string[] {
    const missing: string[] = [];
    if (!this.personal.firstName.trim()) missing.push('first name');
    if (!this.personal.lastName.trim()) missing.push('last name');
    if (!this.personal.dob.trim() || !this.isValidDob(this.personal.dob)) missing.push('valid date of birth');
    if (!this.personal.email.trim() || !this.isValidEmail(this.personal.email)) missing.push('valid email');
    if (!this.personal.phone.trim()) missing.push('phone number');
    if (!this.personal.gender) missing.push('gender');
    return missing;
  }

  private shippingMissingFields(): string[] {
    const missing: string[] = [];
    if (!this.shipping.address1.trim()) missing.push('address 1');
    if (!this.shipping.city.trim()) missing.push('city');
    if (!this.shipping.state.trim() || !this.isValidState(this.shipping.state)) missing.push('valid state');
    if (!this.shipping.zipcode.trim() || !this.isValidZip(this.shipping.zipcode)) missing.push('valid ZIP');
    return missing;
  }

  private healthMissingFields(): string[] {
    const missing: string[] = [];
    if (!this.health.diabetes) missing.push('diabetes type');
    if (this.healthRequiresInsulin && !this.health.insulin) missing.push('insulin use');
    return missing;
  }

  private fetchAddressSuggestions(search: string): void {
    const smartyEmbeddedKey = this.getMetaContent('qms-smarty-embedded-key') || window.QMS_SMARTY_EMBEDDED_KEY || '';
    if (!smartyEmbeddedKey || search.length < 3) {
      this.addressAutocompleteStatus = smartyEmbeddedKey ? '' : 'Address suggestions are not configured.';
      this.hideAddressSuggestions();
      return;
    }
    this.addressAutocompleteStatus = '';

    const params = new URLSearchParams({
      key: smartyEmbeddedKey,
      search,
      max_results: '8',
      source: 'postal',
      prefer_geolocation: 'city',
    });

    fetch(`https://us-autocomplete-pro.api.smarty.com/lookup?${params.toString()}`)
      .then((response) => {
        if (!response.ok) {
          return response.text().then((body) => {
            throw new Error(`Smarty request failed: ${response.status} ${body}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        this.addressSuggestions = data.suggestions || [];
        this.activeAddressSuggestionIndex = -1;
        this.addressAutocompleteStatus = this.addressSuggestions.length ? '' : 'No address suggestions found.';
      })
      .catch((error) => {
        console.warn('[QMS address autocomplete] Smarty request failed.', {
          error,
          host: window.location.hostname,
          search,
        });
        this.addressAutocompleteStatus = 'Address suggestions are unavailable. Enter the address manually.';
        this.hideAddressSuggestions();
      });
  }

  private watchSmartyAddressChanges(): void {
    if (!this.selectedSmartyAddress) {
      return;
    }
    if (!this.addressesMatch(this.shipping, this.selectedSmartyAddress)) {
      this.smartyAddressAltered = true;
      this.smartyAddressConfirmed = false;
    }
  }

  private shouldConfirmSmartyAddressChange(): boolean {
    return Boolean(this.selectedSmartyAddress && this.smartyAddressAltered && !this.smartyAddressConfirmed);
  }

  private addressesMatch(firstAddress: AddressSnapshot, secondAddress: AddressSnapshot): boolean {
    return (Object.keys(firstAddress) as Array<keyof AddressSnapshot>).every(
      (field) =>
        this.normalizedAddressValue(firstAddress[field]) ===
        this.normalizedAddressValue(secondAddress[field]),
    );
  }

  private normalizedAddressValue(value: string): string {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private renderAddressForReview(address: AddressSnapshot): string {
    const street = [address.address1, address.address2].filter(Boolean).join(' ');
    const cityStateZip = [
      address.city,
      [address.state, address.zipcode].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ');
    return [street, cityStateZip].filter(Boolean).join('\n');
  }

  private completeStartOrder(): void {
    this.trackEvent('portal_entered', {
      step_id: 'portal_entry',
      entry_action: 'start_order',
    });
    this.trackEvent('final_application_complete', {
      step_id: 'application_complete',
      completion_action: 'start_order',
      selected_products: this.selectedProducts,
    });
  }

  private loadReviews(): void {
    fetch('/api/reviews')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Reviews API unavailable');
        }
        return response.json();
      })
      .then((data) => this.renderHeader(data.place))
      .catch(() => this.renderHeader(this.fallbackPlace));
  }

  private renderHeader(place: Partial<GooglePlace>): void {
    this.googlePlace = {
      rating: Number(place?.rating) || this.fallbackPlace.rating,
      user_ratings_total: place?.user_ratings_total || this.fallbackPlace.user_ratings_total,
      reviews: Array.isArray(place?.reviews) && place.reviews.length ? place.reviews : this.fallbackPlace.reviews,
    };
    this.reviews = this.googlePlace.reviews;
    this.showReview(0);
    this.startReviewRotation();
  }

  private showReview(index: number): void {
    if (!this.reviews.length) {
      return;
    }
    this.currentReviewIndex = (index + this.reviews.length) % this.reviews.length;
  }

  private startReviewRotation(): void {
    window.clearInterval(this.reviewTimer);
    this.reviewTimer = window.setInterval(() => this.showReview(this.currentReviewIndex + 1), 7000);
  }

  private trackVisibleStepViews(): void {
    let stepIndex = 1;
    this.trackStepView('product_selection', stepIndex++);
    if (this.hasCgmSelected) {
      this.trackStepView('cgm_prescription_history', stepIndex++);
    }
    if (this.hasCompressionSelected && (!this.hasCgmSelected || this.hasCompletedCgmStep())) {
      this.trackStepView('compression_questions', stepIndex++);
    } else if (this.hasCompressionSelected) {
      stepIndex++;
    }
    if (this.personalUnlocked) {
      this.trackStepView('personal_information', stepIndex);
    }
    stepIndex++;
    if (this.shippingUnlocked) {
      this.trackStepView('shipping_information', stepIndex);
    }
    stepIndex++;
    if (this.healthUnlocked) {
      this.trackStepView('health_history', stepIndex);
    }
    stepIndex++;
    if (this.acknowledgementUnlocked) {
      this.trackStepView('acknowledgement', stepIndex);
    }
  }

  private trackStepView(stepId: string, stepIndex: number): void {
    if (this.viewedSteps.has(stepId)) {
      return;
    }
    this.viewedSteps.add(stepId);
    this.trackEvent('step_view', {
      step_id: stepId,
      step_index: stepIndex,
    });
  }

  private trackStepComplete(stepId: string, details: Record<string, unknown> = {}): void {
    if (this.completedSteps.has(stepId)) {
      return;
    }
    this.completedSteps.add(stepId);
    this.trackEvent('step_complete', {
      step_id: stepId,
      ...details,
    });
  }

  private trackEvent(eventType: string, details: Record<string, unknown> = {}): Record<string, unknown> {
    const payload = {
      event: 'qms_application_event',
      event_type: eventType,
      application_id: this.applicationId || this.getApplicationId(),
      attribution: this.captureAttribution(),
      page_path: window.location.pathname || '/',
      timestamp: new Date().toISOString(),
      ...this.sanitizeDetails(details),
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    this.sendToIngest(payload);
    return payload;
  }

  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const blockedKeys = new Set([
      'firstName',
      'lastName',
      'dob',
      'email',
      'phone',
      'address1',
      'address2',
      'city',
      'state',
      'zipcode',
      'zip',
      'name',
    ]);
    return Object.fromEntries(
      Object.entries(details).filter(
        ([key, value]) => !blockedKeys.has(key) && value !== undefined && value !== null && value !== '',
      ),
    );
  }

  private sendToIngest(payload: Record<string, unknown>): void {
    const url = this.getMetaContent('qms-ingest-url');
    if (!url) {
      return;
    }
    const body = JSON.stringify({
      k: this.getMetaContent('qms-ingest-key'),
      ...payload,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
      return;
    }
    fetch(url, { method: 'POST', body, keepalive: true }).catch(() => undefined);
  }

  private getApplicationId(): string {
    const stored = this.getStoredValue('qms_application_id');
    if (stored) {
      return stored;
    }
    const applicationId =
      window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `qms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    this.setStoredValue('qms_application_id', applicationId);
    return applicationId;
  }

  private captureAttribution(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const attribution = this.readStoredAttribution();
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'].forEach(
      (key) => {
        const value = params.get(key);
        if (value) {
          attribution[key] = value;
        }
      },
    );
    if (!attribution['landing_page']) {
      attribution['landing_page'] = window.location.pathname || '/';
    }
    if (!attribution['referrer'] && document.referrer) {
      attribution['referrer'] = this.sanitizeUrl(document.referrer);
    }
    this.setStoredValue('qms_attribution', JSON.stringify(attribution));
    return attribution;
  }

  private readStoredAttribution(): Record<string, string> {
    try {
      return JSON.parse(this.getStoredValue('qms_attribution') || '{}') || {};
    } catch {
      return {};
    }
  }

  private sanitizeUrl(value: string): string {
    try {
      const url = new URL(value, window.location.origin);
      return url.origin + url.pathname;
    } catch {
      return '';
    }
  }

  private getStoredValue(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setStoredValue(key: string, value: string): boolean {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  private getMetaContent(name: string): string {
    return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content || '';
  }

  private scrollToFirstValidationIssue(): void {
    window.setTimeout(() => {
      document
        .querySelector('.is-invalid, .field-error, .acknowledgement-option.is-invalid')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private scheduleAutofillSync(): void {
    [0, 100, 300, 750, 1500, 3000].forEach((delay) => {
      window.setTimeout(() => {
        this.validatePersonal(this.validationAttempts.personal);
        this.validateShipping(this.validationAttempts.shipping);
        this.validateHealth(this.validationAttempts.health);
      }, delay);
    });
  }

  @HostListener('window:pageshow')
  @HostListener('window:focus')
  onWindowSync(): void {
    this.scheduleAutofillSync();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) {
      this.scheduleAutofillSync();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.address-autocomplete-field')) {
      this.hideAddressSuggestions();
    }
  }
}
