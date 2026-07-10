import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { CompatClient, Stomp } from '@stomp/stompjs';
import { BehaviorSubject, distinctUntilChanged, filter, Observable, switchMap } from 'rxjs';
import SockJS from 'sockjs-client';
import {XL_AUTH_CONFIG} from 'xl-auth';
import { XL_API_URL } from './WsToken';


@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
    private stompClient: CompatClient | null = null;
    private isConnected$ = new BehaviorSubject<boolean>(false);
    public connected$ = this.isConnected$.asObservable().pipe(distinctUntilChanged());
    // private authConfig = inject(XL_AUTH_CONFIG);
    private apiUrl = inject(XL_API_URL, { optional: true });
    private ngZone = inject(NgZone);
    constructor() {
        this.initConnection();
    }

    private initConnection() {
        // 1. ПРОВЕРКА: Ако вече имаме клиент и той е в процес на свързване, не прави нищо
        if (this.stompClient && (this.stompClient.active || this.stompClient.connected)) {
            return;
        }

        const socketFactory = () => new SockJS(`${this.apiUrl}/ws`);
        this.stompClient = Stomp.over(socketFactory);

        this.stompClient.reconnect_delay = 5000;
        this.stompClient.heartbeatIncoming = 25000;
        this.stompClient.heartbeatOutgoing = 25000;
        this.stompClient.debug = () => {};

        this.stompClient.onConnect = () => {
            console.log('✅ WebSocket Connected');
            this.isConnected$.next(true);
        };

        this.stompClient.onDisconnect = () => {
            console.warn('⚠️ WebSocket Disconnected (STOMP)');
            this.isConnected$.next(false);
        };

        this.stompClient.onWebSocketClose = () => {
            console.warn('❌ WebSocket Connection Closed');
            this.isConnected$.next(false);
        };

        // Важно: Ако бекендът върне грешка в оторизацията или протокола
        this.stompClient.onStompError = (frame) => {
            console.error('❌ STOMP Error');
            this.isConnected$.next(false);
        };

        // Използвай activate() за съвременните версии на stompjs
        if (this.stompClient.activate) {
            this.stompClient.activate();
        } else {
            this.stompClient.connect({}, () => {});
        }
    }

    /**
     * Слуша за съобщения от конкретен канал (topic)
     */
    public listen(topic: string): Observable<any> {
        return this.isConnected$.pipe(
            distinctUntilChanged(),
            filter(connected => connected),
            switchMap(() => new Observable(observer => {
                const subscription = this.stompClient?.subscribe(`/topic/${topic}`, (message) => {
                    if (message.body) {
                        this.ngZone.run(() => observer.next(JSON.parse(message.body)));
                    }
                });

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
