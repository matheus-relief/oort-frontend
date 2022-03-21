import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeQueryStyleListComponent } from './query-style-list.component';

describe('SafeQueryStyleListComponent', () => {
  let component: SafeQueryStyleListComponent;
  let fixture: ComponentFixture<SafeQueryStyleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SafeQueryStyleListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SafeQueryStyleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});