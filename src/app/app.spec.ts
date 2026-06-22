import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.resolve({ ok: false } as Response));

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the quiz heading and product choices', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain("Let's get your order started!");
    expect(compiled.querySelectorAll('.product-card').length).toBe(4);
  });

  it('should keep locked shipping controls disabled and inert', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const shippingStep = compiled.querySelector('.step4');
    const addressInput = compiled.querySelector<HTMLInputElement>('input[name="address1"]');

    expect(shippingStep?.hasAttribute('inert')).toBeTrue();
    expect(addressInput?.disabled).toBeTrue();
  });

  it('should reject invalid manual state and ZIP values', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.selectedProductIds.add('diabetic_shoes');
    app.personal = {
      firstName: 'Pat',
      lastName: 'Patient',
      dob: '01/01/1970',
      email: 'pat@example.com',
      phone: '(555) 123-4567',
      gender: 'female',
    };
    app.shipping = {
      address1: '123 Main St',
      address2: '',
      city: 'Austin',
      state: 'texas',
      zipcode: '78701abcd',
    };

    app.onShippingInput('state');
    app.onShippingInput('zipcode');
    fixture.detectChanges();

    expect(app.healthUnlocked).toBeFalse();
    expect(app.errors['state']).toContain('valid 2-letter state');
    expect(app.errors['zipcode']).toContain('valid 5-digit ZIP');
  });

  it('should skip insulin when the user is not diabetic', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.selectedProductIds.add('diabetic_shoes');
    app.personal = {
      firstName: 'Pat',
      lastName: 'Patient',
      dob: '01/01/1970',
      email: 'pat@example.com',
      phone: '(555) 123-4567',
      gender: 'female',
    };
    app.shipping = {
      address1: '123 Main St',
      address2: '',
      city: 'Austin',
      state: 'TX',
      zipcode: '78701',
    };

    app.onHealthChange('diabetes', 'not_diabetic');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(app.acknowledgementUnlocked).toBeTrue();
    expect(compiled.textContent).not.toContain('Do you use Insulin');
  });
});
