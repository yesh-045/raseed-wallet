from google.adk.agents import LlmAgent

agent = LlmAgent(name = 'ocr_agent',model="gemini-1.5-flash")
url = 'https://firebasestorage.googleapis.com/v0/b/raseed-d26b4.firebasestorage.app/o/receipts%2FtnBEe1cweQWBnc6HzFMve3hSUke2%2F1753564253779_mdkqvpsjwewbfqi6iao_UK-invoice-template_2.png?alt=media&token=63368188-1f69-4f8f-99cf-81d4aeb9f3de'

prompt = f'Analyze The contents of The url : {url}'

response = agent.invoke(prompt)

print(response)