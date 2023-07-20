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
        const uniqueId = item.item_data.barcode;

        if (this.locationCheck && item.item_data.library != this.library) {
          this.playBeep("C3");
          this.alert.error(`Item with the barcode ${itemBarcode} is not in the ${this.library} library.`);
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

      if (this.bigMoveMode) {
        updateData.item_data.library = {
          value: this.library,
          desc: this.libraryDesc
        }
        updateData.item_data.location = {
          value: this.location,
          desc: this.locationDesc
        }

        // Delete requests
        // Get the request ids
        const ItemRequestRequest: Request = {
          url: `/almaws/v1/bibs/${item.bib_data.mms_id}/holdings/${item.holding_data.holding_id}/items/${item.item_data.pid}/requests`,
          method: HttpMethod.GET
        };

        this.restService.call(ItemRequestRequest).subscribe(data => {
          console.log('Item Request Data:', data);
          if (data && data.user_request) {
            data.user_request.forEach(request => {
              const requestId = request.request_id;

              const deleteRequestsRequest: Request = {
                url: `/almaws/v1/bibs/${item.bib_data.mms_id}/holdings/${item.holding_data.holding_id}/items/${itemId}/requests/${requestId}`,
                method: HttpMethod.DELETE
              }
              // Delete the requests
              this.restService.call(deleteRequestsRequest).subscribe(response => {
                console.log('Delete Request Response:', response);
              }, error => {
                console.error('Error Deleting Request:', error);
              });
            });
          }
        }, error => {
          console.error('Error Fetching Item Request:', error);
        });

        const scanInRequest: Request = {
          url: `/almaws/v1/bibs/${item.bib_data.mms_id}/holdings/${item.holding_data.holding_id}/items/${item.item_data.pid}`,
          queryParams: { op: 'scan', library: this.library, circ_desk: this.circDesk, register_in_house_use: 'true' },
          method: HttpMethod.POST
        };
        this.restService.call(scanInRequest).subscribe(response => {
          console.log('Scan-in Response:', response);
        }, error => {
          console.error('Error Scan-in:', error);
        });
      }


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
