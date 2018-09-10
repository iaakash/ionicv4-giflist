import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RedditService {

 
  public posts: any[] = [];
  public loading: boolean = false;
  private page: number = 1;
  private after: string;
  private moreCount: number = 0;

  constructor(private http: HttpClient) { }


  public load(settings, after?):Observable<any> {
    return this.fetchData(settings, after);
  }

  /** Helpers */

  private fetchData(settings, after):Observable<any> {

    let url = 'https://www.reddit.com/r/' + settings.subreddit + settings.sort + '/.json?limit=100';
    if(after) {
      url += '&after=' + after;
    }
    return this.http.get(url);
  }

}
