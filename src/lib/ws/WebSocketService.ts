import { inject, Injectable, OnDestroy } from '@angular/core';
import { CompatClient, Stomp } from '@stomp/stompjs';
import { BehaviorSubject, filter, Observable, switchMap } from 'rxjs';
import SockJS from 'sockjs-client';
import {XL_AUTH_CONFIG} from 'xl-auth';
import { XL_API_URL } from './WsToken';


@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
    private stompClient: CompatClient | null = null;
    private isConnected$ = new BehaviorSubject<boolean>(false);
    // private authConfig = inject(XL_AUTH_CONFIG);
    private apiUrl = inject(XL_API_URL, { optional: true });
    constructor() {
        this.initConnection();
    }

    private initConnection() {
        // Увери се, че URL-ът съвпада с твоя Java Endpoint
        const socketFactory = () => new SockJS(`${this.apiUrl}/ws`);
        this.stompClient = Stomp.over(socketFactory);
        this.stompClient.heartbeatIncoming = 30000;
        this.stompClient.heartbeatOutgoing = 30000;

        // Спираме логовете в конзолата за по-чист дебъг
        this.stompClient.debug = () => {};

        this.stompClient.connect({},
            () => {
                console.log('✅ WebSocket Connected');
                this.isConnected$.next(true);
            },
            (error: any) => {
                console.error('❌ WebSocket Error:', error);
                this.isConnected$.next(false);
                // Автоматичен реконект след 5 секунди
                setTimeout(() => this.initConnection(), 5000);
            }
        );
    }

    /**
     * Слуша за съобщения от конкретен канал (topic)
     */
    public listen(topic: string): Observable<any> {
        return this.isConnected$.pipe(
            filter(connected => connected), // Чакаме връзката да е активна
            switchMap(() => new Observable(observer => {
                const subscription = this.stompClient?.subscribe(`/topic/${topic}`, (message) => {
                    if (message.body) {
                        observer.next(JSON.parse(message.body));
                    }
                });

                // При отписване от Observable (ngOnDestroy), спираме и STOMP абонамента
                return () => {
                    if (subscription) {
                        subscription.unsubscribe();
                        console.log(`left topic: ${topic}`);
                    }
                };
            }))
        );
    }

    ngOnDestroy() {
        if (this.stompClient) {
            this.stompClient.disconnect();
        }
    }
}
