import { finalize } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudAppRestService, AlertService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Item } from '../interfaces/item.interface';
import { ItemService } from '../item.service';
import { forkJoin } from 'rxjs';
import * as Tone from 'tone'
import { locationCodeMapping } from './location_code_mapping';
import { ItemUpdate } from '../interfaces/item_update.interface';

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
  locationCheck: boolean = false;
  bigMoveMode: boolean = false;
  // Sandbox values 
  // library: string = 'elsc';
  // location: string = '2305open';
  library: string = 'LSC';
  location: string = 'shmoffs';
  libraryDesc: string = 'Offsite Storage';
  locationDesc: string = 'Sheridan Stacks at LSC';
  circDesk: string = 'DEFAULT_CIRC_DESK';

  constructor(
    private restService: CloudAppRestService,
    private alert: AlertService,
    private itemService: ItemService
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
    this.itemService.getItemByBarcode(itemBarcode).pipe(
      finalize(() => this.loading = false)
    ).subscribe(
      item => {
        const uniqueId = item.item_data.barcode;

        if (this.locationCheck && item.item_data.library.value != this.library) {
          this.playBeep("C3");
          this.alert.error(`Item with the barcode ${itemBarcode} is not in the ${this.library} library.`);
          return;
        }

        if (!this.uniqueItemIds.has(uniqueId)) {
          this.uniqueItemIds.add(uniqueId);
          this.itemList.push(item);
        } else {
          this.playBeep("C3");
          this.alert.error(`Item with the barcode ${itemBarcode} already exists in the list.`);
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
      const itemUpdate: ItemUpdate = {
        item: item,
        rmstBarcodeForItems: this.rmstBarcodeForItems,
        bigMoveMode: this.bigMoveMode,
        location: this.location,
        library: this.library,
        libraryDesc: this.libraryDesc,
        locationDesc: this.locationDesc,
        locationCodeMapping: locationCodeMapping
      };

      return this.itemService.updateItem(itemUpdate);
    });

    forkJoin(updateRequests).subscribe({
      next: (response) => {
        if (this.bigMoveMode) {
          this.itemService.scanInItem(response[0], this.library, this.circDesk).subscribe({
            next: (response) => {
              console.log(response);
            },
            error: (error) => {
              console.error(error);
              this.alert.error('An error occurred while running scan-in: ' + error.message);
            }
          });
        }

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
