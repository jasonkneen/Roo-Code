import React, { useEffect, useRef, useState } from "react"
import { OpenAiHandler } from "../../../../src/api/providers/openai"

const VoiceIndicator = () => {
	const [isRecording, setIsRecording] = useState(false)
	const [transcript, setTranscript] = useState("")
	const audioContextRef = useRef<AudioContext | null>(null)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])

	useEffect(() => {
		const startRecording = async () => {
			audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			mediaRecorderRef.current = new MediaRecorder(stream)
			mediaRecorderRef.current.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data)
			}
			mediaRecorderRef.current.onstop = async () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
				const audioUrl = URL.createObjectURL(audioBlob)
				const audio = new Audio(audioUrl)
				audio.play()

				const openAiHandler = new OpenAiHandler({
					openAiApiKey: "YOUR_OPENAI_API_KEY",
					openAiBaseUrl: "https://api.openai.com/v1",
				})

				const response = await openAiHandler.completePrompt("Transcribe this audio: " + audioUrl)
				setTranscript(response)
			}
		}

		if (isRecording) {
			startRecording()
		} else {
			mediaRecorderRef.current?.stop()
		}

		return () => {
			mediaRecorderRef.current?.stop()
			audioContextRef.current?.close()
		}
	}, [isRecording])

	return (
		<div>
			<button onClick={() => setIsRecording((prev) => !prev)}>
				{isRecording ? "Stop Recording" : "Start Recording"}
			</button>
			<p>{transcript}</p>
		</div>
	)
}

export default VoiceIndicator
