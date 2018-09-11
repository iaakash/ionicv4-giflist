import { DataService } from "./../services/data.service";
import { SettingsPage } from "./../settings/settings.page";
import { Plugins } from "@capacitor/core";
import { RedditService } from "./../services/reddit.service";
import { Component, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { FormControl, FormGroup, FormBuilder } from "@angular/forms";

const { Browser, Keyboard } = Plugins;

import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"]
})
export class HomePage implements OnInit {
  subredditForm: FormGroup;
  public settings = {
    perPage: 10,
    subreddit: "gifs",
    sort: "/hot"
  };
  public posts: any[] = [];
  public loading: boolean = true;
  public postStore = [];
  public favoritePostStack = [];
  private page: number = 1;
  private after: string;
  private moreCount: number = 0;

  constructor(
    public RedditService: RedditService,
    private fb: FormBuilder,
    private dataService: DataService,
    private modalCtrl: ModalController
  ) {
    this.subredditForm = this.fb.group({
      subredditControl: [""]
    });
  }

  /** Hooks and Other Event Listeners */
  ngOnInit() {
    this.dataService.getData().then(settings => {

      if (settings) {
        this.settings = settings;
      }
      // load gifs initially
      this.loading = true;
      this.loadPosts();
    });

    this.observeSubredditForm();
  }

  public loadMore() {
    this.page++;
    this.posts = [...this.posts, ...this.loadPostsToDisplay()];
  }

  public toggleVideo(e) {
    const video = e.target;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  public showComments(post) {
    Browser.open({
      toolbarColor: "#fff",
      url: "http://reddit.com" + post.data.permalink,
      windowName: "_system"
    });
  }

  public openSettings() {
    this.modalCtrl.create({
      component: SettingsPage
    }).then(modal => {
      modal.onDidDismiss().then(_ => {
        this.refreshPostsBasedOnSettings();
      });
      modal.present();
    })
  }

  public addToFavorites(event, post) {
    event.stopPropagation();
    this.favoritePostStack.push(post);
    console.log('this.favoritePostStack:::', this.favoritePostStack);
  }

  public isFavourite(post) {
    
    if(this.favoritePostStack.length > 0) {
      this.favoritePostStack;

      let isIndex = this.favoritePostStack.findIndex(item => post.data.id == item.data.id);
      console.log('isIndex:::', isIndex);
      return isIndex > -1 ? 'heart': 'heart-empty';
    }else {
      return 'heart-empty';
    }
   
    
  }
  /** Helpers */
  private loadPosts() {
    this.RedditService.load(this.settings).subscribe(data => {
      this.loading = false;
      this.posts = this.loadPostsToDisplay(
        this.filterAndProcessGifs(data.data.children)
      );
    });
  }

  private loadPostsToDisplay(store = this.postStore): Array<any> {
    let posts_extracted = [];
    for (var i = 0; i < this.settings.perPage; i++) {
      posts_extracted.push(store[i]);
    }
    //clear postStore and reset index
    this.postStore.splice(0, this.settings.perPage);
    console.log("posts left::", this.postStore);

    // Fill Post Store here if it's less than postPerPage
    if (this.postStore.length < this.settings.perPage) {
      this.after = this.postStore[this.postStore.length - 1].data.name;
      this.refuelPostsStoreFromReddit(this.after);
    }
    return posts_extracted;
  }

  private refuelPostsStoreFromReddit(after) {
    this.RedditService.load(this.settings, after).subscribe(data => {
      this.loading = false;
      this.postStore = [
        ...this.postStore,
        ...this.filterAndProcessGifs(data.data.children)
      ];
    });
  }

  private observeSubredditForm() {
    this.subredditForm
      .get("subredditControl")
      .valueChanges.pipe(
        debounceTime(1500),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.changeSubreddit(query);
      });
  }

  private refreshPostsBasedOnSettings() {
    this.dataService.getData().then(settings => {
      this.settings = settings;
      this.after = null;
      this.postStore = [];

      this.loadPosts();
    })
    
  }

  private changeSubreddit(subreddit) {
    if(subreddit == 'favorites') {
      this.posts = this.favoritePostStack;
    }else {
      this.settings.subreddit = subreddit;
      this.after = null;
      this.postStore = [];
      this.loadPosts();
    }
    
  }

  private filterAndProcessGifs(data: Array<Object>): Array<Object> {
    let postStack = 0;

    let filtered_posts_by_format = data
      .filter((post: any) => {
        if (
          post.data.url.indexOf(".gifv") > -1 ||
          post.data.url.indexOf(".webm") > -1
        ) {
          return true;
        } else {
          return false;
        }
      })
      .map((post: any) =>
        Object.assign({}, post, {
          url: post.data.url.replace(/.gifv|.webm/g, ".mp4")
        })
      );

    let curated_posts = filtered_posts_by_format.map(post => {
      let snapshot = "";
      let new_post;
      if (typeof post.data.preview !== "undefined") {
        new_post = Object.assign({}, post, {
          snapshot: post.data.preview.images[0].source.url.replace(
            /&amp;/g,
            "&"
          )
        });
        return new_post;
      } else {
        new_post = Object.assign({}, post, {
          snapshot
        });
        return new_post;
      }
    });
    //
    this.postStore = curated_posts;
    console.log("this.postStore::", this.postStore);
    return this.postStore;
  }
}
