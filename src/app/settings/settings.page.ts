import { DataService } from './../services/data.service';
import { ModalController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  
  settings = {
    subreddit: '',
    sort: '',
    perPage: ''
  };
  constructor(
    private modalCtrl: ModalController,
    private DataService: DataService
  ) { }

  ngOnInit() {
  }

  save() {
    this.DataService.saveData(this.settings);
    this.close();
  }

  public async close() {
    const modal = await this.modalCtrl.getTop();
    modal.dismiss();
  }

}
