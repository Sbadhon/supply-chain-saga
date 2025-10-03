import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCreateModalComponent } from './payment-create-modal.component';

describe('PaymentCreateModalComponent', () => {
  let component: PaymentCreateModalComponent;
  let fixture: ComponentFixture<PaymentCreateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentCreateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentCreateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
