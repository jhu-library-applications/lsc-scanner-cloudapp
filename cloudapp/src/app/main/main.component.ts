import { finalize } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudAppRestService, AlertService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Item } from '../interfaces/item.interface';
import { forkJoin } from 'rxjs';
import * as Tone from 'tone'

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  loading = false;
  uniqueItemIds: Set<string> = new Set();
  itemList: Item[] = [];
  rmstBarcodeForItems: string;
  locationCheck: boolean = true;

  constructor(
    private restService: CloudAppRestService,
    private alert: AlertService 
  ) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  playBeep(note: string): void {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease(note, "8n");
  }

  onItemEnterPressed(itemBarcode: string, inputElement: HTMLInputElement) {
    this.loading = true;
    inputElement.value = '';
    this.restService.call(`/almaws/v1/items?item_barcode=${itemBarcode}`).pipe(
      finalize(() => this.loading = false)
    ).subscribe(
      item => {
        const uniqueId = item.bib_data.mms_id;

        if (this.locationCheck && item.item_data.library != 'LSC') {
          this.playBeep("C3");
          this.alert.error(`Item with the barcode ${itemBarcode} is not in the LSC library.`);
          return;
        }

        if (!this.uniqueItemIds.has(uniqueId)) {
          this.uniqueItemIds.add(uniqueId);
          this.itemList.push(item);
        } else {
          this.playBeep("C3");
          this.alert.error(`Item ${itemBarcode} already exists in the list.`);
        }
      },
      error => {
        console.error(error);
        this.playBeep("C3");
        this.alert.error('An error occurred while retrieving this item.');
      }
    )
  }

  onRMSTEnterPressed(rmstBarcode: string) {
    this.rmstBarcodeForItems = rmstBarcode;
  }

  onSubmit() {
    this.loading = true;

    const updateRequests = this.itemList.map(item => {
      const updateData = item;
      updateData.item_data.storage_location_id = this.rmstBarcodeForItems;

      // Change the status of the item from in-process to available
      updateData.item_data.internal_note_1 = '';


      const itemId = item.item_data.pid;
  
      const request: Request = {
        url: `/almaws/v1/bibs/${item.bib_data.mms_id}/holdings/${item.holding_data.holding_id}/items/${itemId}`,
        method: HttpMethod.PUT,
        requestBody: updateData
      };
  
      return this.restService.call(request);
    });
  
    forkJoin(updateRequests).subscribe({
      next: () => {
        this.loading = false;
        this.itemList = [];
        this.uniqueItemIds = new Set();
        this.rmstBarcodeForItems = undefined;
  
        this.alert.success('RMST added to all items successfully.');
      },
      error: (error) => {
        this.loading = false;
        console.error(error);
        this.alert.error('An error occurred while updating the items: ' + error.message);
      }
    });
  }

  removeItem(item: Item): void {
    this.itemList = this.itemList.filter(currentItem => currentItem !== item);
  
    const uniqueId = item.bib_data.mms_id;
    this.uniqueItemIds.delete(uniqueId);
  }

  reset(): void {
    this.itemList = [];
    this.uniqueItemIds = new Set();
    this.rmstBarcodeForItems = undefined;
  }
}
