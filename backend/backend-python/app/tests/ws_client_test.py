import asyncio
import websockets

async def test_websocket():
    uri = 'ws://localhost:8000/ws/worker-test'
    async with websockets.connect(uri) as websocket:
        counter = 1
        while True:
            message = f'Hello {counter}'
            await websocket.send(message)
            print(f'Sent: {message}')
            response = await websocket.recv()
            print(f'Received: {response}')
            counter += 1
            await asyncio.sleep(2)

if __name__ == '__main__':
    asyncio.run(test_websocket()) 