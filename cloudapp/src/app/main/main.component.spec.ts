import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MainComponent } from './main.component';
import { CloudAppRestService, CloudAppEventsService, AlertService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { of } from 'rxjs';
import { Item } from '../interfaces/item.interface';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;
  let restService: CloudAppRestService;
  let alertService: AlertService;
  let mockInputElement = document.createElement('input');
  const mockItem: Item = {
    bib_data: {
      title: 'Test Title',
      mms_id: '123456'
    },
    holding_data: {
        holding_id: '123456'
    },
    item_data: {
        pid: '123456789'
    }
  };

  const secondMockItem: Item = {
    bib_data: {
      title: 'Test Title',
      mms_id: '7654321'
    },
    holding_data: {
        holding_id: '7654321'
    },
    item_data: {
        pid: '987654321'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainComponent],
      imports: [
        HttpClientModule,
        MatIconModule,
        MatInputModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatButtonModule
      ],
      providers: [
        CloudAppRestService,
        CloudAppEventsService,
        AlertService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    restService = TestBed.inject(CloudAppRestService);
    alertService = TestBed.inject(AlertService);
    fixture.detectChanges();

    
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have an empty itemList initially', () => {
    expect(component.itemList.length).toEqual(0);
  });

  it('should add a unique item to itemList when Enter key is pressed', () => {
    spyOn(restService, 'call').and.returnValue(of(mockItem));
    component.onItemEnterPressed('itemBarcode', mockInputElement);
    expect(component.itemList.length).toEqual(1);
    expect(component.itemList[0]).toEqual(mockItem);
  });

  it('should not add a duplicate item to itemList when Enter key is pressed', () => {
    spyOn(restService, 'call').and.returnValue(of(mockItem));
    component.onItemEnterPressed('itemBarcode', mockInputElement);
    component.onItemEnterPressed('itemBarcode', mockInputElement);
    expect(component.itemList.length).toEqual(1);
    expect(component.itemList[0]).toEqual(mockItem);
  });

  it('should remove the item from the itemList and uniqueItemIds', () => {
    const item1: Item = mockItem;
    const item2: Item = secondMockItem;

    component.itemList = [item1, item2];
    component.uniqueItemIds.add(item1.bib_data.mms_id);
    component.uniqueItemIds.add(item2.bib_data.mms_id);

    component.removeItem(item1);

    expect(component.itemList).toEqual([item2]);
    expect(component.uniqueItemIds.has(item1.bib_data.mms_id)).toBe(false);
    expect(component.uniqueItemIds.has(item2.bib_data.mms_id)).toBe(true);
  });

  it('should set rmstBarcodeForItems when onRMSTEnterPressed is called', () => {
    const rmstBarcode = '12345';
    component.onRMSTEnterPressed(rmstBarcode);
    expect(component.rmstBarcodeForItems).toBe(rmstBarcode);
  });
});
