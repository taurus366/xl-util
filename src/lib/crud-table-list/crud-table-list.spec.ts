import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrudTableList } from './crud-table-list';

describe('CrudTableList', () => {
  let component: CrudTableList;
  let fixture: ComponentFixture<CrudTableList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrudTableList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrudTableList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
